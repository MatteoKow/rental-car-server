let User = require('../models/user');
const Employee = require('../models/employee');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require("nodemailer");

const loginUser = async (req, res) => {
    const {username, password} = req.body;

    try {
      const user = await User.findOne({ $or: [{ username: username}, { email: username }] });
      if (!user) {
        return res.status(400).send({ message: 'Login lub hasło nieprawidłowe!', code: 400 });
      }
      const isPasswordCorrect = await bcrypt.compare(password, user.password)

      if (!isPasswordCorrect) {
        return res.status(400).send({ message: 'Login lub hasło nieprawidłowe!', code: 400 });
      }
      const payload = { id: user._id, role: user.role };
      const privateKey = process.env.JWT_SECRET;
      const expiresIn = '7d';
      const token = jwt.sign(payload, privateKey, {expiresIn}) 
      
      return res.status(200).json({
        status: 200,
        message: "Login success",
        access_token: token,
        data: user
      });
    } catch {
      res.status(400).send({ message: 'Wystapił błąd aplikacji', code: 400 });
    }
};

const logout = async (req, res) => {
  try {
      return res.status(200).send({message: "Wylogowano pomyślnie"});
  } catch (error) {
      return res.status(400).send({ message: 'Wystąpił błąd podczas wylogowywania', code: 400 });
  }
};


const createUser = async (req, res) => {
  try {
    const { firstName, lastName, dateOfBirth, phone, username, email, password, role } = req.body;

    if (!firstName || !lastName || !username || !email || !password) {
      return res.status(400).send({ message: "Wszystkie pola są wymagane.", code: 400 });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).send({ message: "Użytkownik z tą nazwą użytkownika lub adresem email już istnieje.", code: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      firstName,
      lastName,
      dateOfBirth,
      phone,
      username,
      password: hashPassword,
      email,
      role
    });

    await newUser.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "rentalcarbusinesscontact@gmail.com",
        pass: "fuujddkbargfivkk",
      },
    });

    const mailOptions = {
      from: "rentalcarbusinesscontact@gmail.com",
      to: email,
      subject: "Nowe konto",
      html: `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Zmiana hasła</title>
      </head>
      <body>
      
          <h2>Nowe konto</h2>
          
          <p>Witaj ${firstName}!</p>
          <p>Dziękujemy za stworzenie konta.</p>
          
      </body>
      </html>`
    };

    transporter.sendMail(mailOptions, async (error, data) => {
      if (error) {
        console.error("Błąd podczas wysyłania e-maila:", error);
        res.status(500).send("Błąd podczas wysyłania e-maila.");
      } else {
        res.status(201).send("Użytkownik został utworzony pomyślnie.");
      }
    });

  } catch (error) {
    console.error("Błąd podczas tworzenia użytkownika:", error);
    res.status(500).send("Wystąpił błąd serwera podczas tworzenia użytkownika.");
  }
};


const createEmployeeUser = async (req, res) => {
  try {
    const { employeeId, firstName, lastName, dateOfBirth, phone, username, email, password, role } = req.body;

    if (!firstName || !lastName || !username || !email || !password) {
      return res.status(400).send({message: "Wszystkie pola są wymagane.",  code: 400});
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).send({message: "Użytkownik z tą nazwą użytkownika lub adresem email już istnieje.", code: 400});
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      firstName,
      lastName,
      dateOfBirth,
      phone,
      username,
      password: hashPassword,
      email,
      role
    });
    const savedUser = await newUser.save()
    .catch(err => res.status(400).json("Error: " + err));
    const userId = savedUser._id;

    await Employee.findById({_id:employeeId})
     .then(employee => {
      employee.id_account = userId;
      employee.account = true;
      employee.save()
      .catch(err => res.status(400).json("Error: " + err));
     })


    // sendWelcomeEmail()
    return res.status(201).send("Użytkownik został utworzony pomyślnie.");
  } catch (error) {
    console.error("Błąd podczas tworzenia użytkownika:", error);
    return res.status(500).send("Wystąpił błąd serwera podczas tworzenia użytkownika.");
  }
}

const sendMailForResetPassword = async (req, res) => {
  const {emailToReset} = req.body;
  try {
    const user = await User.findOne({ email: emailToReset});
    if (!user) {
      return res.status(400).send({ message: 'Nie znaleniono konta!', code: 400 });
    }

    const payload = {
      email: user.email
    };
    const privateKey = process.env.JWT_SECRET;
    const expiresIn = 300;
  
    const token = jwt.sign(payload, privateKey, {expiresIn}) 

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "rentalcarbusinesscontact@gmail.com",
        pass: "fuujddkbargfivkk",
      },
    });
  
    const mailOptions = {
      from: "rentalcarbusinesscontact@gmail.com",
      to: emailToReset,
      subject: "Reset hasła",
      html: `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Zmiana hasła</title>
      </head>
      <body>
      
          <h2>Zmiana hasła</h2>
          
          <p>Witaj!</p>
          <p>Otrzymałeś tę wiadomość, ponieważ poprosiłeś o zmianę hasła.</p>
          
          <p>Aby dokonać zmiany hasła, kliknij poniższy przycisk:</p>
          
          <a href=${process.env.URL_PAGE}/reset/${token} style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: #fff; text-decoration: none; border-radius: 5px;">Potwierdź zmianę hasła</a>
      
          <p>Jeśli nie prosiłeś o zmianę hasła, zignoruj tę wiadomość.</p>
          
      </body>
      </html>`
    };
  
    transporter.sendMail(mailOptions, async(error, data) => {
      if (error) {
        console.error("Błąd podczas wysyłania e-maila:", error);
        res.status(500).send("Błąd podczas wysyłania e-maila.");

      } else {
        res.status(201).send("Email wysłany poprawnie");
      }
    });
 
  } catch {
    res.status(400).send({ message: 'Wystapił błąd aplikacji', code: 400 });
  }
};

module.exports = { loginUser, createUser, createEmployeeUser, logout, sendMailForResetPassword};

 