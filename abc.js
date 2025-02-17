const bcrypt = require("bcrypt");

// Replace with the actual hashed password from the database
const storedHash = "$2b$10$IIMmHuRAacL9QUat7VpcdOO1e3D4TJej0I7jpshKzMk9LF84CRz0O";  
const inputPassword = "mypassword123"; // Replace with the password you are trying

bcrypt.compare(inputPassword, storedHash, (err, result) => {
    if (err) throw err;
    console.log("Password Match:", result);
});
