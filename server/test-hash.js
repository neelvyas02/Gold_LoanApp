import bcrypt from "bcrypt";
console.log("admin:", bcrypt.hashSync("admin", 10));
console.log("employee:", bcrypt.hashSync("employee", 10));
