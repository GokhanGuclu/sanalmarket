const nodemailer = require("nodemailer");

async function dogrulamaKoduMail(alicimail, kod) {
    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.MAIL, 
            pass: "peka aytt ocsx yjcm"   
        }
    });

    let mailOptions = {
        from: process.env.MAIL,
        to: alicimail,
        subject: "Test Mailidir bu allah",
        text: "bilmem ne doğrulama kodunuz @1231231dır"
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        console.log("E-posta gönderildi: %s", info.messageId);
    } catch (error) {
        console.error("E-posta gönderilemedi:", error);
    }
}

dogrulamaKoduMail();
