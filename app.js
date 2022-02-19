const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const lodash = require("lodash");

const date = require(__dirname+ "/date.js");
const day = date.getDate();

const app = express();

mongoose.connect("mongodb://localhost:27017/todolistDB");

const itemsSchema = {
    name: String
};
const Item = mongoose.model("Item", itemsSchema); 

const item1 = new Item({
    name: "Welcome to Your To-DO List!"
});
const item2 = new Item({
    name: "Hit the + button to add new item."
});
const item3 = new Item({
    name: "<-- Hit this to delete the item."
});

const defaultItems = [item1, item2, item3];


const listSchema = {
    name: String,
    items: [itemsSchema]
};
const List = mongoose.model("List", listSchema); 


app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


app.get("/", function(req, res){

    // let day = date.getDate;
    Item.find({}, function(err, foundItems){
        if(foundItems.length === 0){
            Item.insertMany(defaultItems, function(err){
                if(err)
                    console.log(err);
                else
                    console.log("Successfully added default items to array!");    
            });
            res.redirect("/");
        }else{
            res.render("list", {listTitle: day, newListItems: foundItems});
        }
        
    }); 
});

app.get("/:customListName", function(req, res){
    const customListName = lodash.capitalize(req.params.customListName);
    List.findOne({name: customListName}, function(err, foundList){
        if(!err){
            if(!foundList){
                // console.log("Doesn't exist");
                //So, Create a new list
                const list = new List({
                    name: customListName
                });
                list.save();
                res.redirect("/"+customListName);
            }else{
                // console.log("Exists");
                //Show an existing list
                res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
            }
        }
    });
});

app.post("/", function(req, res){
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if(listName === day){
        item.save();
        res.redirect("/");
    }else{
        List.findOne({name: listName}, function(err, foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/"+listName);
        })
    }  
});

app.post("/delete", function(req, res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;
    
    if(listName === day){
        // console.log(checkedItemId);
        Item.deleteOne({
            _id : req.body.checkbox
        }, function(err){
            if(err)
                console.log(err);
            else
                console.log("Successfuly deleted");    
        });
        res.redirect("/");
    }else{
        List.findOneAndUpdate({name: listName},
            {$pull: {items: {_id: checkedItemId}}},
            function(err, result){
                if(!err)
                    console.log("Succesfully deleted");
                    res.redirect("/"+listName);
        });
    }
    
});


app.listen(3000, function(){
    console.log("Server started on port: 3000");
})