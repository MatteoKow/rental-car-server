let User = require('../models/user');
let Employee = require('../models/employee');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const jwt = require('jsonwebtoken');


const bcrypt = require('bcryptjs');

const getUsers = async (req, res) => {
    try {
        const users = await User.find();
        return res.send(users);
    } catch {
        res.status(400).send({ message: 'Wystapił błąd aplikacji', code: 400 });
    }

};

const getUser = async (req, res) => {

    try {
        const users = await User.findById(req.params.id);
        return res.send(users);
    } catch {
        res.status(400).send({ message: 'Wystapił błąd aplikacji', code: 400 });
    }
};

const getFavouritesById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).send({ message: 'Użytkownik o podanym ID nie został znaleziony', code: 404 });
    }

    const favourites = user.favourites || [];

    return res.send(favourites);
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Wystąpił błąd aplikacji', code: 500 });
  }
};

const getFavouritesCars = async (req, res) => {
  try {
      const cars = await User.aggregate([
        {
          $match: {
            "_id": new ObjectId(req.params.id)
          }
        },
        {
          $lookup: {
            from: "cars",
            let: { favCars: "$favourites" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: [
                      { $toObjectId: "$_id" },
                      { $map: { input: "$$favCars", as: "favCar", in: { $toObjectId: "$$favCar" } } }
                    ]
                  }
                }
              },
              {
                $lookup: {
                  from: "makes",
                  localField: "make_id",
                  foreignField: "_id",
                  as: "make_info"
                }
              },
              {
                $unwind: "$make_info"
              },
              {
                $project: {
                  "_id": 1,
                  "active": 1,
                  "title": 1,
                  "description": 1,
                  "typeCar": 1,
                  "year": 1,
                  "fuel": 1,
                  "horsepower": 1,
                  "color": 1,
                  "transmission": 1,
                  "engine": 1,
                  "doors": 1,
                  "ac": 1,
                  "image": 1,
                  "price": 1,
                  make: "$make_info.name",
                  makeImage: "$make_info.logo"
                }
              }
            ],
            as: "favouriteCars"
          }
        },
        {
          $unwind: "$favouriteCars"
        },
        {
          $project: {
            "_id": "$favouriteCars._id",
            "active": "$favouriteCars.active",
            "title": "$favouriteCars.title",
            "description": "$favouriteCars.description",
            "typeCar": "$favouriteCars.typeCar",
            "year": "$favouriteCars.year",
            "fuel": "$favouriteCars.fuel",
            "horsepower": "$favouriteCars.horsepower",
            "color": "$favouriteCars.color",
            "transmission": "$favouriteCars.transmission",
            "engine": "$favouriteCars.engine",
            "doors": "$favouriteCars.doors",
            "ac": "$favouriteCars.ac",
            "image": "$favouriteCars.image",
            "price": "$favouriteCars.price",
            "make": "$favouriteCars.make",
            "makeImage": "$favouriteCars.makeImage"
          }
        }
      ]
      );
      return res.send(cars);
  } catch (error) {
      console.error(error);
      res.status(400).send({ message: 'Wystąpił błąd aplikacji', code: 400 });
  }
};

const addFavourites = async (req, res) => {
  try {
      const {favourites} = req.body;
      await User.findById(req.params.id)
      .then(user => {
        user.favourites = favourites;
        user.save()
        .then(() => res.json("Car added"))
        .catch(err => res.status(400).json("Error: " + err));
      })
  } catch (error) {
      console.error(error);
      res.status(400).send({ message: 'Wystąpił błąd aplikacji', code: 400 });
  }
};

const getEmployeesAccount = async (req, res) => {

    try {
        const users = await User.find({ "role": { $ne: 1 } });
        return res.send(users);
    } catch {
        res.status(400).send({ message: 'Wystapił błąd aplikacji', code: 400 });
    }
};

const getEmployeeAccountById = async (req, res) => {
    try {
        const user = await User.findOne({
            "_id": req.params.id,
            "role": { "$ne": 1 }
          });
        return res.send(user);
    } catch {
        res.status(400).send({ message: 'Wystapił błąd aplikacji', code: 400 });
    }
};

const updateUser = async (req, res) => {
    const { username, email, firstName, lastName, dateOfBirth, phone, drivingLicense, address, city, zipCode, country } = req.body;

    if (!username) return res.status(400).send({message: "Username jest pusty",  code: 400});
    else if(!email) return res.status(400).send({message: "Email jest pusty",  code: 400});
 
    const existingUser = await User.findOne({
        $and: [
          { $or: [{ username }, { email }] },
          { _id: { $ne: req.params.id } }
        ]
      });
    if (existingUser) {
      return res.status(400).send({message: "Użytkownik z tą nazwą użytkownika lub adresem email już istnieje.", code: 400});
    }

    await User.findById(req.params.id)
       .then(user => {
        user.username = username;
        user.email = email;
        user.firstName = firstName;
        user.lastName = lastName;
        user.dateOfBirth = dateOfBirth;
        user.phone = phone;
        user.drivingLicense = drivingLicense;
        user.address = address;
        user.city = city;
        user.zipCode = zipCode;
        user.country = country;

        user.save()
        .then(() => res.json("User updated"))
        .catch(err => res.status(400).json("Error: " + err));
       })
       .catch(err => res.status(400).json("Error: " + err));
};

const updateEmployeeUser = async (req, res) => {
    const { username, email, role } = req.body;

    if (!username) return res.status(400).send({message: "Username jest pusty",  code: 400});
    else if(!email) return res.status(400).send({message: "Email jest pusty",  code: 400});
 
    const existingUser = await User.findOne({
        $and: [
          { $or: [{ username }, { email }] },
          { _id: { $ne: req.params.id } }
        ]
      });
    if (existingUser) {
      return res.status(400).send({message: "Użytkownik z tą nazwą użytkownika lub adresem email już istnieje.", code: 400});
    }

    await User.findById(req.params.id)
       .then(user => {
        user.username = username;
        user.email = email;
        user.role = role;

        user.save()
        .then(() => res.json("User updated"))
        .catch(err => res.status(400).json("Error: " + err));
       })
       .catch(err => res.status(400).json("Error: " + err));
};

const changePassword = async (req, res) => {
    const { id, oldPassword, newPassword} = req.body;

    if (!oldPassword) return res.status(400).send({message: "Stare hasło jest puste",  code: 400});
    else if(!newPassword) return res.status(400).send({message: "Nowe hasło jest puste",  code: 400});

    const user = await User.findOne({ _id: id });
    if (!user) {
        return res.status(400).send({ message: 'Nie ma takiego usera', code: 400 });
      }
    
    const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password);

    if (!isPasswordCorrect) {
        return res.status(400).send({ message: 'Stare hasło jest nieprawidłowe', code: 400 });
      }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(newPassword, salt);

    await User.findById(id)
       .then(user => {
        user.password = hashPassword;
        user.save()
        .then(() => res.json("Password changed!"))
        .catch(err => res.status(400).json("Error: " + err));
       })
       .catch(err => res.status(400).json("Error: " + err));
};
const resetPassword = async (req, res) => {
  const {token, newPassword} = req.body;

  if(!newPassword) return res.status(400).send({message: "Nowe hasło jest puste",  code: 400});
  
  jwt.verify(token, process.env.JWT_SECRET, async (error, data) => {
    if(error){
      return res.status(400).send({ message: 'Link wygasł', code: 400 });
    } else {
      const response = data;
      const user = await User.findOne({ email: { $regex: '^' + response.email + '$', $options: 'i' } });
      
      const salt = await bcrypt.genSalt(10);
      const hashPassword = await bcrypt.hash(newPassword, salt);
      user.password = hashPassword;

      try {
        const updatedUser = await User.findOneAndUpdate(
          {_id: user._id},
          {$set: user},
          {new: true}
        )
        return res.status(200).send({ message: 'Pomyślnie zmieniono hasło', code: 200 });  
      } catch (error) {
        return res.status(400).send({ message: 'Coś poszło nie tak :(', code: 400 });  
      }
    }
  }); 
};
 
const deleteUser = async (req, res) => { 
  try {
      const user = await User.findByIdAndDelete(req.params.id);

      if (user) {
          const employee = await Employee.findOne({"id_account": req.params.id});
          if (employee) {
              employee.id_account = "";
              await employee.save();
          }
      }

      res.json("User deleted");
  } catch (error) {
      console.error(error);
      res.status(500).send({ message: 'Wystąpił błąd aplikacji', code: 500 });
  }
};




module.exports = {getUsers, getUser, getEmployeesAccount, getEmployeeAccountById, updateUser, updateEmployeeUser, changePassword, deleteUser, getFavouritesById, addFavourites, getFavouritesCars, resetPassword};