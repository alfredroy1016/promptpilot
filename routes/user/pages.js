const express = require('express');
const router = express.Router();

router.get('/contact', (req, res) => {
  res.render('user/contact');
});

router.get('/terms', (req, res) => {
  res.render('user/terms');
});

router.get('/shipping', (req, res) => {
  res.render('user/shipping');
});

router.get('/privacy', (req, res) => {
  res.render('user/privacy');
});



router.get('/help',(req,res)=>{
  res.render('user/help');
})

router.get('/refund',(req,res)=>{
  res.render('user/refund')
})
module.exports = router;
