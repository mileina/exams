// backend/controllers/productControllerOptimized.js
// BUG #6 FIX: Optimisation N+1 queries avec populate/aggregation

const Product = require('../models/Product');
const logger = require('../config/logger');

// ✅ BUG #6 FIX: Récupérer tous les produits AVEC reviews sans N+1
const getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    // ❌ MAUVAIS (N+1 problem):
    // const products = await Product.find().skip(skip).limit(limit);
    // for (let product of products) {
    //   product.reviewsCount = product.reviews.length;  // Une requête par produit!
    // }

    // ✅ BON: Une seule requête avec populate et agrégation
    const products = await Product.find()
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'reviews',
        select: 'rating comment author createdAt'
      })
      .lean() // Retourner des objets simples (pas des Document Mongoose)
      .exec();

    // Enrichir les données côté serveur (pas une requête par produit)
    const enrichedProducts = products.map(product => ({
      ...product,
      reviewsCount: product.reviews?.length || 0,
      avgRating: product.reviews?.length > 0
        ? (product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length).toFixed(1)
        : 0
    }));

    const total = await Product.countDocuments();
    const pages = Math.ceil(total / limit);

    res.json({
      products: enrichedProducts,
      pagination: { page, limit, total, pages }
    });
  } catch (error) {
    logger.error('Get all products error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des produits' });
  }
};

// ✅ BUG #6 FIX: Récupérer un seul produit AVEC toutes ses données
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // ❌ MAUVAIS: Plusieurs requêtes
    // const product = await Product.findById(id);
    // const reviews = await Review.find({ product: id });
    // const seller = await User.findById(product.seller);

    // ✅ BON: Une seule requête avec populate chaîné
    const product = await Product.findById(id)
      .populate({
        path: 'reviews',
        select: 'rating comment author createdAt',
        populate: {
          path: 'author',
          select: 'name email -password'
        }
      })
      .populate('seller', 'name email shop')
      .lean()
      .exec();

    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    // Calculer les stats une fois
    const stats = product.reviews?.length > 0
      ? {
          totalReviews: product.reviews.length,
          avgRating: (product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length).toFixed(1),
          distribution: {
            5: product.reviews.filter(r => r.rating === 5).length,
            4: product.reviews.filter(r => r.rating === 4).length,
            3: product.reviews.filter(r => r.rating === 3).length,
            2: product.reviews.filter(r => r.rating === 2).length,
            1: product.reviews.filter(r => r.rating === 1).length
          }
        }
      : { totalReviews: 0, avgRating: 0, distribution: {} };

    res.json({
      product: {
        ...product,
        reviewStats: stats
      }
    });
  } catch (error) {
    logger.error('Get product by id error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du produit' });
  }
};

// ✅ BUG #6 FIX: Agrégation avancée pour les statistiques
const getProductStats = async (req, res) => {
  try {
    // ❌ MAUVAIS: Boucler sur tous les produits
    // const products = await Product.find();
    // let totalReviews = 0, avgPrice = 0;
    // for (let p of products) {
    //   totalReviews += p.reviews.length;  // Une requête par produit!
    // }

    // ✅ BON: Agrégation en une seule requête
    const stats = await Product.aggregate([
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'product',
          as: 'reviews'
        }
      },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalReviews: { $sum: { $size: '$reviews' } },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          avgRating: {
            $avg: {
              $cond: [
                { $eq: [{ $size: '$reviews' }, 0] },
                0,
                {
                  $divide: [
                    { $sum: '$reviews.rating' },
                    { $size: '$reviews' }
                  ]
                }
              ]
            }
          }
        }
      }
    ]);

    res.json({
      stats: stats[0] || {
        totalProducts: 0,
        totalReviews: 0,
        avgPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        avgRating: 0
      }
    });
  } catch (error) {
    logger.error('Get product stats error:', error);
    res.status(500).json({ message: 'Erreur lors du calcul des statistiques' });
  }
};

// ✅ BUG #6 FIX: Récupérer les produits les plus populaires
const getTopProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // ❌ MAUVAIS: Charger tous les produits puis les trier
    // const products = await Product.find();
    // products.sort((a, b) => b.reviews.length - a.reviews.length);

    // ✅ BON: Agrégation avec tri à la source
    const topProducts = await Product.aggregate([
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'product',
          as: 'reviews'
        }
      },
      {
        $addFields: {
          reviewCount: { $size: '$reviews' },
          avgRating: {
            $cond: [
              { $eq: [{ $size: '$reviews' }, 0] },
              0,
              { $divide: [{ $sum: '$reviews.rating' }, { $size: '$reviews' }] }
            ]
          }
        }
      },
      {
        $match: { reviewCount: { $gt: 0 } }
      },
      {
        $sort: { avgRating: -1, reviewCount: -1 }
      },
      {
        $limit: limit
      },
      {
        $project: {
          name: 1,
          price: 1,
          image: 1,
          reviewCount: 1,
          avgRating: { $round: ['$avgRating', 1] }
        }
      }
    ]);

    res.json({ products: topProducts });
  } catch (error) {
    logger.error('Get top products error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des produits populaires' });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  getProductStats,
  getTopProducts
};

