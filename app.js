import express from "express";
import nunjucks from "nunjucks";
import morgan from "morgan";
import session from "express-session";
import users from "./users.json" assert { type: "json" };
import stuffedAnimalData from "./stuffed-animal-data.json" assert { type: "json" };

const app = express();
const port = "8000";

app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));
app.use(
  session({ secret: "ssshhhhh", saveUninitialized: true, resave: false })
);

nunjucks.configure("views", {
  autoescape: true,
  express: app,
});


app.get("/", (req, res) => {
  res.render("index.html");
});

app.get("/all-animals", (req, res) => {
  res.render("all-animals.html.njk", {
    animals: Object.values(stuffedAnimalData), name:req.session.name,
  });
});

app.get("/animal-details/:animalId", (req, res) => {
  const { animalId } = req.params;
  const animal = stuffedAnimalData[animalId];
  res.render("animal-details.html.njk", { animal: animal, name:req.session.name,});
});

app.get("/add-to-cart/:animalId", (req, res) => {
  const { animalId } = req.params;
  if (!req.session.cart) {
    req.session.cart = {};
  }
  if (!(animalId in req.session.cart)) {
    req.session.cart[animalId] = 0;
  }
  req.session.cart[animalId] += 1;
  res.redirect("/cart");
});

app.get("/cart", (req, res) => {
  const { cart } = req.session;
  let arr = [];
  let total = 0;
  for (let animalId in cart) {
    let animal = stuffedAnimalData[animalId];
    animal.quantity = cart[animalId];
    animal.subtotal = animal.quantity * animal.price;
    arr.push(animal);
    total += animal.subtotal;
  }
  res.render("cart.html.njk", { arr, total, name:req.session.name});
});

app.get("/checkout", (req, res) => {
  // Empty the cart.
  req.session.cart = {};
  res.redirect("/all-animals");
});

app.get("/login", (req, res) => {
  res.render("login.html.njk");
});

app.post("/process-login", (req, res) => {
  for (const { username, password, name } of users) {
    if (req.body.username === username && req.body.password === password) {
      req.session.name = name
      return res.redirect("/all-animals");
    }
  }
  res.render("login.html.njk", { message: "Invalid username or password" });
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
    }
    res.redirect("/all-animals");
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}...`);
});
