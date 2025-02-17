const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Employee = require('../models/Employee');
const { GraphQLScalarType, Kind } = require('graphql');
const dotenv = require('dotenv');

// Custom Date Scalar Type
const dateScalar = new GraphQLScalarType({
    name: 'Date',
    description: 'Date custom scalar type',
    serialize(value) {
        return value instanceof Date ? value.getTime() : null;
    },
    parseValue(value) {
        return typeof value === 'number' ? new Date(value) : null;
    },
    parseLiteral(ast) {
        return ast.kind === Kind.INT ? new Date(parseInt(ast.value, 10)) : null;
    },
});

const resolvers = {
    Date: dateScalar,
    
    Query: {
        login: async (_, { username, email, password }) => {
            try {
                const user = await User.findOne({ $or: [ {username}, {email}] });
                if (!user) throw new Error('User or email not found');

                
                const isMatch = await user.matchPassword(password);
                console.log(isMatch);
                if (!isMatch) throw new Error('Invalid credentials');

                const token = jwt.sign({ id: user._id }, process.env.SECRET, { expiresIn: '1d' });

                return { message: "Login successful!",
                  token, 
                  user 
                };
            } catch (error) {
                throw new Error(error.message);
            }
        },

        getAllEmployees: async () => {
            try {
                return await Employee.find();
            } catch (error) {
                throw new Error("Error fetching employees: " + error.message);
            }
        },
        getEmployeeById: async (_, { id }) => {
            try {
                return await Employee.findById(id);
            } catch (error) {
                throw new Error("Error fetching employee: " + error.message);
            }
        },
        getEmployeesByDesignationOrDepartment: async (_, { designation, department }) => {
            try {
                return await Employee.find({ $or: [{ designation }, { department }] });
            } catch (error) {
                throw new Error("Error fetching employees: " + error.message);
            }
        },
    },

    Mutation: {
        signup: async (_, { username, email, password }) => {
            try {
                // ✅ Manual Validation (Remove express-validator)
                if (!username || username.length < 3) {
                    throw new Error('Username must be at least 3 characters long.');
                }
                if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
                    throw new Error('Invalid email format.');
                }
                if (!password || password.length < 6) {
                    throw new Error('Password must be at least 6 characters long.');
                }

                // Check if the user already exists
                const existingUser = await User.findOne({ $or: [{ username }, { email }] });
                if (existingUser) {
                    throw new Error("Email or Username is already in use.");
                }

                // Hash password and create new user
                const newUser = new User({ username, email, password });
                await newUser.save();
                const token = jwt.sign({ id: newUser._id }, process.env.SECRET, { expiresIn: '1d' });
                
                
                console.log(token);
                return {
                    message: "User registered successfully!",
                    token,
                    user: newUser
                };
            } catch (error) {
                throw new Error(error.message);
            }
        },

        addNewEmployee: async (_, args) => {
            try {
              const { first_name, last_name, email, gender, designation, salary, date_of_joining, department } = args;
              console.log(args);


              if (!first_name || !last_name || !email || !gender || !designation || !salary || !date_of_joining || !department) {
                throw new Error("All fields are required.");
              }
             
              const emailRegex = /^\S+@\S+\.\S+$/;
              if (!emailRegex.test(email)) {
                  throw new Error("Invalid email format.");
              }
              
              if (salary < 1000) {
                  throw new Error("Salary must be at least 1000.");
              }


              // Ensure `date_of_joining` is in correct format (YYYY-MM-DD)
              if (isNaN(Date.parse(date_of_joining))) {
                throw new Error("Invalid date format. Expected format: YYYY-MM-DD.");
              }

              // ✅ Check if employee already exists (based on email)
              const existingEmployee = await Employee.findOne({ email });
              if (existingEmployee) {
                throw new Error("Employee with this email already exists.");
              }     

              // ✅ Save new employee
              const employee = new Employee(args);
              await employee.save();
      
                return employee;
            } catch (error) {
                throw new Error("Error adding employee: " + error.message);
            }
        },

        updateEmployee: async (_, { id, ...updates }) => {
            try {
                return await Employee.findByIdAndUpdate(id, updates, { new: true });
            } catch (error) {
                throw new Error("Error updating employee: " + error.message);
            }
        },

        deleteEmployee: async (_, { id }) => {
            try {
                await Employee.findByIdAndDelete(id);
                return `Employee ${id} deleted`;
            } catch (error) {
                throw new Error("Error deleting employee: " + error.message);
            }
        },
    },
};

module.exports = resolvers;
