import { stripe } from "../lib/stripe.js";
import Coupon from "../models/Couponmodel.js";
import Order from "../models/Ordermodel.js";

export const createCheckoutSession = async (req, res) => {
    try {
      const { products, couponCode } = req.body;
      if (!Array.isArray(products) || products.length < 1) {
        return res.status(400).send("Cart is empty");
      }
  
      let totalAmount = 0;
  
      const lineItems = products.map((product) => {
        const amount = Math.round(product.price * 100);
        totalAmount += amount * product.quantity;
  
        return {
          price_data: {  // Corrected key
            currency: "INR",  // Correct currency
            product_data: {  // Corrected key
              name: product.name,
              images: [product.image],
            },
            unit_amount: amount,
          },
          quantity: product.quantity || 1
        };
      });
  
      let coupon = null;
      if (couponCode) {
        coupon = await Coupon.findOne({
          code: couponCode,
          userId: req.user._id,
          isActive: true,
        });
  
        if (coupon) {
          totalAmount = totalAmount - (totalAmount * coupon.discountPercentage) / 100;  // Correct discount application
        }
      }
  
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
        discounts: coupon
          ? [
              {
                coupon: await createStripeCoupon(coupon.discountPercentage),
              },
            ]
          : [],
        metadata: {
          userId: req.user._id.toString(),
          couponCode: couponCode || "",
          products: JSON.stringify(
            products.map((p) => ({
              id: p._id,
              quantity: p.quantity,
              price: p.price,
            }))
          ),
        },
      });
  
      // Example: If totalAmount is above 20,000 INR
      if (totalAmount >= 20000) {
        await createNewCoupon(req.user._id);
      }
  
      res.status(200).json({ id: session.id, totalAmount: totalAmount / 100 });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  };
  


export const checkoutSuccess = async(req,res) =>{
    try {
        const {sessionId} = req.body;
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if(session.payment_status === "paid"){
            if(session.metadata.couponCode){
                await Coupon.findOneAndDelete({
                    code: session.metadata.couponCode, 
                    userId: session.metadata.userId
                },{
                    isActive:false
                })
            }
            // create a new order
            const products = JSON.parse(session.metadata.products);


            const newOrder = new Order({
                user: session.metadata.userId,
                products : products.map(product => ({
                    product: product.id,
                    quantity: product.quantity,
                    price: product.price
                })),
                totalAmount: session.amount_total/100,  //converting cents to dollars which used to multiply by 100
                stripeSessionId: sessionId
            })

            await newOrder.save();

            res.status(200).json({
                success: true,
                message: "Payment successful. order created, and coupon deactivated if used.",
                orderId : newOrder._id,
            })
        }
    } catch (error) {
        console.error("Error processing successful checkout" ,error);
      res.status(500).json({message: "Error processing successful checkout", error: error.message });
    }
}





async function createStripeCoupon(discountPercentage) {
  const coupon = await stripe.coupons.create({
    percent_off: discountPercentage,
    duration: "once",
  });
  return coupon.id
}

async function createNewCoupon(userId) {
  await Coupon.findOneAndDelete({userId})
    const newCoupon = new Coupon({
        code: "GIFT" + Math.random().toString(36).substring(2).toUpperCase(),
        discountPercentage:10,
        expirationDate: new Date(Date.now() + 30* 24* 60 * 60* 1000),   //30days from now
        userId:userId
    })
    await newCoupon.save();
    
    return newCoupon
}
