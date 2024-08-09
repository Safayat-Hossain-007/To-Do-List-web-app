import express from "express";
import bodyparser from "body-parser";
import mongoose from "mongoose";
import _ from "loadsh";



// const day = date.getDate();

// console.log(date.getDay());

const app = express();
app.use(bodyparser.urlencoded({
  extended: true
}));
app.use(express.static("public"))
app.set("view engine", "ejs");

mongoose.connect("mongodb+srv://safayat:s123456@cluster0.fjb21.mongodb.net/toDoListDB");

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Meditate"
});
const item2 = new Item({
  name: "Brush Teeth"
});
const item3 = new Item({
  name: "Eat breakfast"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);

app.get("/", async (req, res) => {
  try {
    const foundItems = await Item.find({});

    if (foundItems.length === 0) {
      await Item.insertMany(defaultItems);
      console.log("Successfully added default items documents");
      res.redirect("/");
    } else {
      res.render("list", {

        listTitle: "Today",
        newListItems: foundItems
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});


app.get("/about",(req,res)=>{
  res.render("about");
});

app.get("/:customListName", async (req, res) => {
  // console.log(req.params.customListName);
  const customListName = _.capitalize(req.params.customListName);

  try {
    const foundList = await List.findOne({ name: customListName });

    if (!foundList) {
      // console.log("Doesn't exist!");
      //create a new list if doesnt exist
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      list.save();
      res.redirect("/" + customListName)
    } else {
      // console.log("Exists!");
      //render if exists
      res.render("list", {

        listTitle: foundList.name,
        newListItems: foundList.items
      })
    }
  } catch (err) {
    console.error("An error occurred:", err);
    res.status(500).send("An error occurred");
  }
});




app.post("/", async function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });


  if (listName === "Today") {
    item.save()
      .then(() => {
        console.log("Item: " + itemName + " added successfully!");
        res.redirect("/");
      })
      .catch((err) => {
        console.error("An error occurred:", err);
        res.status(500).send("An error occurred");
      });
  } else {
    try {
      const foundList = await List.findOne({ name: listName });

      if (foundList) {
        foundList.items.push(item);
        await foundList.save();
        res.redirect("/" + listName);
      } else {
        // Handle the case where the list is not found
        res.status(404).send("List not found");
      }
    } catch (err) {
      console.error("An error occurred:", err);
      res.status(500).send("An error occurred");
    }
  }
});

app.post("/delete", function (req, res) {
  const checkedID = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.findByIdAndDelete(checkedID)
      .then(() => {
        console.log("Successfully deleted the item.");
        res.redirect("/");
      })
      .catch((err) => {
        console.error("Error deleting item:", err);
        res.status(500).send("An error occurred while deleting the item.");
      });
  } else {
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedID } } })
      .then(foundItems => {
        if (foundItems) {
          res.redirect("/" + listName);
        } else {
          // Handle the case where no list was found or no item was removed
          res.status(404).send("List or item not found");
        }
      })
      .catch(err => {
        console.error("Error updating list:", err);
        res.status(500).send("Failed to update the list");
      });

  }

});


app.get("/about", function (req, res) {
  res.render("about");
})


app.listen(3000, function () {
  console.log("running on port 3000");
})