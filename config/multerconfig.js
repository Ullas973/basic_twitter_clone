const multer = require('multer');
const crypto = require('crypto');
const Path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/images/uploads");
  },
  filename: function (req, file, cb) {
    crypto.randomBytes(12,function(err,name){
        const fn =  name.toString("hex")+Path.extname(file.originalname)
        cb(null,fn);
    })
    
  },
});

const upload = multer({ storage: storage }); // this is our export variable and now we should exporting this!

module.exports = upload;
//bas hogaya here we have set up the disk storage that is disk storage is read for iploading files 