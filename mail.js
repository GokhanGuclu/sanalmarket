const nodemailer = require("nodemailer");

async function dogrulamaKoduMail(alicimail, kod) {
    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.MAIL, 
            pass: "eswh vwws arjt tsgk"   
        }
    });

    let mailOptions = {
        from: process.env.MAIL,
        to: alicimail,
        subject: "Market alışverişiniz için teslimat kodu!",
        text: "Kapınıza gelecek olan kuryeye " + kod + "'u söyleyerek siparişinizi teslim alabilirsiniz." 
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        console.log("E-posta gönderildi: %s", info.messageId);
    } catch (error) {
        console.error("E-posta gönderilemedi:", error);
    }
}

