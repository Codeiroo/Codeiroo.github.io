const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Importar configuración de MongoDB
const mongoConfig = require('../config/mongodb.config');

// Crear la aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../')));

// Conectar a MongoDB
mongoose.connect(mongoConfig.localUri || mongoConfig.uri, mongoConfig.options)
  .then(() => {
    console.log('Conexión exitosa a MongoDB');
  })
  .catch(err => {
    console.error('Error al conectar a MongoDB:', err);
  });

// Definir el esquema para los códigos de error
const ErrorCodeSchema = new mongoose.Schema({
  id: Number,
  brand: String,
  brandName: String,
  model: String,
  errorCode: String,
  title: String,
  description: String,
  causes: [String],
  solutions: [String],
  severity: String,
  diagram: String,
  manualLinks: [{
    text: String,
    url: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware para actualizar la fecha de actualización
ErrorCodeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Crear el modelo
const ErrorCode = mongoose.model(mongoConfig.collections.errors, ErrorCodeSchema);

// Definir el esquema para el registro de actividades (para auditoría)
const ActivityLogSchema = new mongoose.Schema({
  action: String, // create, update, delete
  entityType: String, // errorCode, brand, etc.
  entityId: String,
  details: Object,
  timestamp: {
    type: Date,
    default: Date.now
  },
  userId: String, // ID del usuario (email por ahora)
  userIp: String
});

// Crear el modelo de logs
const ActivityLog = mongoose.model('activity_logs', ActivityLogSchema);

// Middleware para registro de actividad
const logActivity = (req, res, next) => {
  res.on('finish', () => {
    // Solo registrar actividad para acciones correctas (2xx, 3xx)
    if (res.statusCode >= 200 && res.statusCode < 400) {
      const action = getActionFromMethod(req.method);
      if (action) {
        const log = new ActivityLog({
          action,
          entityType: getEntityType(req.path),
          entityId: getEntityId(req.path),
          details: req.body,
          userId: req.get('X-User-Email') || 'anonymous',
          userIp: req.ip
        });
        
        log.save()
          .catch(err => console.error('Error al guardar log de actividad:', err));
      }
    }
  });
  
  next();
};

// Funciones auxiliares para el log de actividad
function getActionFromMethod(method) {
  switch (method) {
    case 'POST': return 'create';
    case 'PUT': return 'update';
    case 'DELETE': return 'delete';
    default: return null;
  }
}

function getEntityType(path) {
  if (path.includes('/errorcodes')) return 'errorCode';
  if (path.includes('/brands')) return 'brand';
  return 'unknown';
}

function getEntityId(path) {
  const matches = path.match(/\/([^\/]+)\/(\d+)$/);
  return matches ? matches[2] : 'new';
}

// Rutas API
// Aplicar logging en rutas de modificación
app.post('/api/*', logActivity);
app.put('/api/*', logActivity);
app.delete('/api/*', logActivity);

// Obtener todos los códigos de error
app.get('/api/errorcodes', async (req, res) => {
  try {
    const errorCodes = await ErrorCode.find();
    res.json(errorCodes);
  } catch (err) {
    console.error('Error al obtener códigos de error:', err);
    res.status(500).json({ error: 'Error al obtener códigos de error' });
  }
});

// Obtener códigos de error filtrados
app.get('/api/errorcodes/search', async (req, res) => {
  try {
    // Destructuring params
    const { brand, model, errorCode, q } = req.query;
    
    // Construir el filtro
    const filter = {};
    
    if (brand) {
      filter.brand = { $regex: brand, $options: 'i' };
    }
    
    if (model) {
      filter.model = { $regex: model, $options: 'i' };
    }
    
    if (errorCode) {
      filter.errorCode = { $regex: errorCode, $options: 'i' };
    }
    
    // Si hay un término general de búsqueda (q), buscar en múltiples campos
    if (q) {
      filter.$or = [
        { errorCode: { $regex: q, $options: 'i' } },
        { title: { $regex: q, $options: 'i' } },
        { model: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }
    
    const errorCodes = await ErrorCode.find(filter);
    res.json(errorCodes);
  } catch (err) {
    console.error('Error al buscar códigos de error:', err);
    res.status(500).json({ error: 'Error al buscar códigos de error' });
  }
});

// Obtener un código de error por ID
app.get('/api/errorcodes/:id', async (req, res) => {
  try {
    const errorCode = await ErrorCode.findOne({ id: req.params.id });
    if (!errorCode) {
      return res.status(404).json({ error: 'Código de error no encontrado' });
    }
    res.json(errorCode);
  } catch (err) {
    console.error('Error al obtener código de error:', err);
    res.status(500).json({ error: 'Error al obtener código de error' });
  }
});

// Crear un nuevo código de error
app.post('/api/errorcodes', async (req, res) => {
  try {
    // Obtener el máximo ID actual
    const maxIdResult = await ErrorCode.findOne().sort('-id');
    const nextId = maxIdResult ? maxIdResult.id + 1 : 1;
    
    // Crear nuevo código de error con ID autoincrementado
    const newErrorCode = new ErrorCode({
      id: nextId,
      ...req.body,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    
    const savedErrorCode = await newErrorCode.save();
    res.status(201).json(savedErrorCode);
  } catch (err) {
    console.error('Error al crear código de error:', err);
    res.status(500).json({ error: 'Error al crear código de error' });
  }
});

// Actualizar un código de error existente
app.put('/api/errorcodes/:id', async (req, res) => {
  try {
    const errorId = req.params.id;
    const updates = { ...req.body, updatedAt: Date.now() };
    
    // Buscar y actualizar
    const updatedError = await ErrorCode.findOneAndUpdate(
      { id: errorId },
      updates,
      { new: true } // Devolver el documento actualizado
    );
    
    if (!updatedError) {
      return res.status(404).json({ error: 'Código de error no encontrado' });
    }
    
    res.json(updatedError);
  } catch (err) {
    console.error('Error al actualizar código de error:', err);
    res.status(500).json({ error: 'Error al actualizar código de error' });
  }
});

// Eliminar un código de error
app.delete('/api/errorcodes/:id', async (req, res) => {
  try {
    const errorId = req.params.id;
    const deletedError = await ErrorCode.findOneAndDelete({ id: errorId });
    
    if (!deletedError) {
      return res.status(404).json({ error: 'Código de error no encontrado' });
    }
    
    res.json({ message: 'Código de error eliminado correctamente', deletedId: errorId });
  } catch (err) {
    console.error('Error al eliminar código de error:', err);
    res.status(500).json({ error: 'Error al eliminar código de error' });
  }
});

// Ruta para inicializar la base de datos con datos de ejemplo
app.post('/api/init', async (req, res) => {
  try {
    // Borrar todos los registros existentes
    await ErrorCode.deleteMany({});
    
    // Importar la base de datos de ejemplo
    const sampleData = require('../ErrorCodes/js/errorDatabase');
    
    // Añadir fechas de creación y actualización a cada registro
    const now = Date.now();
    const dataWithDates = sampleData.map(error => ({
      ...error,
      createdAt: now,
      updatedAt: now
    }));
    
    // Insertar los datos
    await ErrorCode.insertMany(dataWithDates);
    
    res.status(200).json({ message: 'Base de datos inicializada correctamente', count: sampleData.length });
  } catch (err) {
    console.error('Error al inicializar la base de datos:', err);
    res.status(500).json({ error: 'Error al inicializar la base de datos' });
  }
});

// Obtener estadísticas generales
app.get('/api/stats', async (req, res) => {
  try {
    // Contar el número total de errores
    const totalErrors = await ErrorCode.countDocuments();
    
    // Contar el número de marcas distintas
    const brands = await ErrorCode.distinct('brand');
    const totalBrands = brands.length;
    
    // Obtener fecha de la última actualización
    const latestUpdate = await ErrorCode.findOne().sort('-updatedAt');
    const lastUpdate = latestUpdate ? latestUpdate.updatedAt : null;
    
    // Obtener distribución por marca
    const errorsByBrand = await ErrorCode.aggregate([
      { $group: { _id: '$brand', brandName: { $first: '$brandName' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Obtener distribución por severidad
    const errorsBySeverity = await ErrorCode.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Estadísticas de actividad reciente
    const recentActivity = await ActivityLog.find()
      .sort('-timestamp')
      .limit(10);
    
    res.json({
      totalErrors,
      totalBrands,
      lastUpdate,
      errorsByBrand,
      errorsBySeverity,
      recentActivity
    });
  } catch (err) {
    console.error('Error al obtener estadísticas:', err);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// Servir el frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../index.html'));
});

app.get('/ErrorCodes', (req, res) => {
  res.sendFile(path.join(__dirname, '../ErrorCodes/index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin/index.html'));
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});