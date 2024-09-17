const Employee = require('../models/employee');
const User = require('../models/user');


const addEmployee = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            dateOfBirth,
            jobPosition,
            salary,
            phone,
            typeDocument,
            idDocument,
            address,
            city,
            code,
            country,
        } = req.body;


        const newEmployee = new Employee({
            firstName,
            lastName,
            dateOfBirth,
            jobPosition,
            salary,
            phone,
            typeDocument,
            idDocument,
            address,
            city,
            code,
            country,
        });
        await newEmployee.save();

        return res.status(201).json({ message: 'Pracownik został dodany' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
    }
};



const getEmployees = async (req, res) => {
    try {
        const employees = await Employee.find({ active: true });
        return res.send(employees);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
    }
};
const getInactiveEmployees = async (req, res) => {
    try {
        const employees = await Employee.find({ active: false });
        return res.send(employees);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
    }
}

const getEmployeeById = async (req, res) => {
    try {
        const empmloyee = await Employee.findById(req.params.id);
        return res.send(empmloyee);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
    }
};

const getEmployeesWithoutAccount = async (req, res) => {
    try {
        const employees = await Employee.find({
            "id_account": "",
            "active": true
          });
        return res.send(employees);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
    }
};

const updateEmployee = async (req, res) => {
    let {firstName, lastName, jobPosition, salary, typeDocument, idDocument, dateOfBirth, phone, address, city, code, country } = req.body;
    if(!firstName) return res.json("Brak imienia");
    if(!lastName) return res.json("Brak nazwiska");
    if(!jobPosition) jobPosition = "";
    if(!salary) salary = 0;
    if(!typeDocument) typeDocument = "";
    if(!idDocument) idDocument = "";
    if(!dateOfBirth) dateOfBirth = "";
    if(!phone) phone = "";
    if(!address) address = "";
    if(!city) city = "";
    if(!code) code = "";
    if(!country) country = "";


    await Employee.findById(req.params.id)
       .then(employee => {
        employee.firstName = firstName;
        employee.lastName = lastName;
        employee.jobPosition = jobPosition;
        employee.salary = salary;
        employee.typeDocument = typeDocument;
        employee.idDocument = idDocument;
        employee.dateOfBirth = dateOfBirth;
        employee.phone = phone;
        employee.address = address;
        employee.city = city;
        employee.code = code;
        employee.country = country;


        employee.save()
        .then(() => res.json("Employee updated"))
        .catch(err => res.status(400).json("Error: " + err));
       })
       .catch(err => res.status(400).json("Error: " + err));
};

const archiveEmployee = async (req, res) => {
    try {
        const archiveUser = await Employee.findById(req.params.id); 
        


        if (archiveUser.id_account) {
            const user = await User.findById(archiveUser.id_account);
            if (user) {
                await User.deleteOne({ _id: user._id });
            }
        }

        if (!archiveUser) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        archiveUser.active = false;
        archiveUser.id_account = "";
        await archiveUser.save();

        return res.json("Employee archived");
    } catch (err) {
        return res.status(500).json({ error: 'Internal server error' });
    }
};

const activateEmployee = async (req, res) => {
    await Employee.findById(req.params.id)
       .then(employee => {
        employee.active = true;
        employee.save()
        .then(() => res.json("Employee activated"))
        .catch(err => res.status(400).json("Error: " + err));
       })
       .catch(err => res.status(400).json("Error: " + err));
};

module.exports = { addEmployee, getEmployees, getInactiveEmployees, getEmployeeById, getEmployeesWithoutAccount, updateEmployee, archiveEmployee, activateEmployee};