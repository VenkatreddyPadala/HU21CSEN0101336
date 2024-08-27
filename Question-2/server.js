const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const port = 5000;
// Define number of products per page
const PRODUCTS_PER_PAGE = 10;
const AUTH_URL = "http://20.244.56.144/test/auth";
const API_URL = "http://20.244.56.144/test/companies";

let bearerToken = null;

// Function to authenticate and obtain bearer token
const authenticate = async () => {
  try {
    const authResponse = await axios.post(AUTH_URL, {
        companyName: "AFFORDMED",
        clientID: "eff7d647-d1f1-45e4-b8d5-e1ce0eba54b7",
        clientSecret: "TYvoZHFFBPtFNbVL",
        ownerName: "VENKATREDDYPADALA",
        ownerEmail: "vpadala2@gitam.in",
        rollNo: "HU21CSEN0101336",
    });

    bearerToken = authResponse.data.access_token;
  } catch (error) {
    console.error("Error during authentication:", error.message);
    throw new Error("Authentication failed");
  }
};

// Function to fetch products from a specified company
const fetchProducts = async (company, category, minPrice, maxPrice, top, offset) => {
  let products = [];

  try {
    const response = await axios.get(
      `${API_URL}/${company}/categories/${category}/products`,
      {
        params: { top, minPrice, maxPrice, offset },
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      }
    );
    products = response.data;
  } catch (error) {
    console.error(`Error fetching products from ${company}:`, error.message);
  }

  return products;
};

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to render the index page with the search form
app.get('/', (req, res) => {
  res.render('index');
});

// Route to get products with pagination
app.get("/products", async (req, res) => {
    const { company, category, minPrice, maxPrice, topN = 10, page = 1 } = req.query;
    
    try {
      // Authenticate if the token is not present or expired
      if (!bearerToken) {
        await authenticate();
      }
      
      // Pagination parameters
      const topNInt = parseInt(topN) || 10; // Number of products per page
      const pageInt = parseInt(page) || 1;   // Current page number
      const offset = (pageInt - 1) * topNInt; // Calculate offset
  
      // Fetch total number of products
      // Using a large topN to get all products for counting. This might need optimization.
      const allProducts = await fetchProducts(company, category, minPrice, maxPrice, 1000000, 0);
      const totalProducts = allProducts.length;
      
      // Fetch paginated products
      const products = await fetchProducts(company, category, minPrice, maxPrice, topNInt, offset);
      
      // Calculate total pages
      const totalPages = Math.ceil(totalProducts / topNInt);
      
      // Render the index page with the fetched products
      res.render('index', { 
        products,
        totalProducts,
        totalPages,
        currentPage: pageInt,
        query: req.query
      });
    } catch (error) {
      console.error("Error:", error.message);
      res.status(500).render('index', { products: [], error: "Failed to fetch products" });
    }
  });
  

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
