const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const NOVELS_PATH = path.join(__dirname, 'novels.json');
const ORDERS_PATH = path.join(__dirname, 'orders.json');

if (!fs.existsSync(NOVELS_PATH)) {
  console.error('Error: novels.json not found. Add it and restart.');
  process.exit(1);
}
if (!fs.existsSync(ORDERS_PATH)) {
  fs.writeFileSync(ORDERS_PATH, '[]', 'utf8');
}

const novels = JSON.parse(fs.readFileSync(NOVELS_PATH, 'utf8'));

function readOrders() {
  try {
    return JSON.parse(fs.readFileSync(ORDERS_PATH, 'utf8'));
  } catch (e) {
    return [];
  }
}
function writeOrders(orders) {
  fs.writeFileSync(ORDERS_PATH, JSON.stringify(orders, null, 2), 'utf8');
}

function generateId() {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
}

// Routes
app.get('/', (req, res) => {
  res.render('index', { novels });
});

app.get('/novel/:id', (req, res) => {
  const novel = novels.find(n => n.id === req.params.id);
  if (!novel) return res.status(404).send('الرواية غير موجودة');
  res.render('novel', { novel });
});

app.post('/create-order', (req, res) => {
  const { novelId, customerName, customerEmail } = req.body;
  const novel = novels.find(n => n.id === novelId);
  if (!novel) return res.status(404).send('الرواية غير موجودة');

  const orders = readOrders();
  const order = {
    id: generateId(),
    novelId: novel.id,
    novelTitle: novel.title,
    price: novel.price,
    customerName: customerName || '',
    customerEmail: customerEmail || '',
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  orders.push(order);
  writeOrders(orders);

  // Redirect to order status page
  res.redirect(`/order/${order.id}`);
});

app.get('/order/:orderId', (req, res) => {
  const orders = readOrders();
  const order = orders.find(o => o.id === req.params.orderId);
  if (!order) return res.status(404).send('الطلب غير موجود');
  const novel = novels.find(n => n.id === order.novelId);
  res.render('order', { order, novel });
});

// Download route: متاح فقط إذا حالة الطلب paid
app.get('/download/:orderId', (req, res) => {
  const orders = readOrders();
  const order = orders.find(o => o.id === req.params.orderId);
  if (!order) return res.status(404).send('الطلب غير موجود');

  if (order.status !== 'paid') {
    return res.status(403).send('الملف غير متاح للتحميل لأن الطلب لم يُعلَم كمدفوع بعد.');
  }

  const novel = novels.find(n => n.id === order.novelId);
  if (!novel) return res.status(404).send('الرواية غير موجودة');

  const filePath = path.join(__dirname, novel.file);
  if (!fs.existsSync(filePath)) return res.status(404).send('ملف الرواية غير موجود على الخادم');

  res.download(filePath, path.basename(filePath));
});

// Admin interface: ادارة الطلبات (محمي بمفتاح ADMIN_KEY)
const ADMIN_KEY = process.env.ADMIN_KEY || 'secret-admin-key';

app.get('/admin', (req, res) => {
  const key = req.query.key || '';
  if (key !== ADMIN_KEY) {
    // عرض صفحة بسيطة تطلب المفتاح (بدون كشف بيانات)
    return res.render('admin_login', { message: null });
  }
  const orders = readOrders();
  res.render('admin', { orders, key });
});

app.post('/admin/mark-paid', (req, res) => {
  const { key, orderId } = req.body;
  if (key !== ADMIN_KEY) return res.status(403).send('مفتاح إداري غير صالح');

  const orders = readOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return res.status(404).send('الطلب غير موجود');

  order.status = 'paid';
  order.paidAt = new Date().toISOString();
  writeOrders(orders);

  res.redirect(`/admin?key=${encodeURIComponent(key)}`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log('Admin key:', ADMIN_KEY === 'secret-admin-key' ? '(default secret-admin-key — change via ADMIN_KEY env)' : '(set via ADMIN_KEY env)');
});
