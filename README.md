This is a react project with a backend of NodeJS.
I couldn't call the odoo API directly from the frontend as it shows CORS errors dues to this project not being from the same source as the odoo instance. Therefore, I had to create a backend using NodJS and have CORS implemented to avoid the CORS error.

==Backend==
In the backend there is a index.js which is the server file. 
We have CORS implemented to avoid this error: CORS header 'Access-Control-Allow-Origin' missing
The cors we have accepts access from our frontend server, which is in line 10 in index.js:

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));


In the index.js there are 2 routes:
  1. /signin: used to call the functions in the sign-in routes.
  2. /products: used to call the funcitons in the products routes.

In the backend there is a .env file that has the following:
URL=https://egy.thetalenter.net
ODOO_DB=odoodb1

In controller folder in the backend there are 2 files:
  1. auth.js:
      This has the functions used for authentication. Firstly, there is the signin funciton which sends a post request to the URL in the .env file: process.env.URL and accessing the endpoint of `/web/session/authenticate`. This function uses jsonrpc 2.0 and has method of call. It takes parameters of login = email, password = password, db = process.env.ODOO_DB (odoodb1).
      If the user signed in successfully, the odoo session cookie is extracted from the header by having: const cookies = response.headers['set-cookie']; and then getting the session cookie by searching for session_id by doing:  const sessionCookie = cookies.find(cookie => cookie.startsWith('session_id='));. 
      Secondly, we verify that session id from odoo by sending a request to the endpoint: `${url}/web/dataset/call_kw` and checking the model of res.users with a method of read, and it is fetching the following fields: ['id', 'name', 'login', 'email']. 

  2. products.js:
      We hve a function called getProducts which sends a request to the endpoint `${url}/web/dataset/call_kw`, it checks for the model product.product using the method of search_read and it returns back the following fields: ['name', 'default_code', 'qty_available', 'virtual_available', 'list_price', 'standard_price', 'image_1920' ,'categ_id', 'weight', 'sale_ok', ]. This method uses the sessionId that we have saved when the user signed in for authentication.

In the routes folder there are 2 files:
  1. auth.routes.js:
    It has the following routes that we can use from the frontend to call the funcitons in the controller:
      A- /signin --> to access the funciton signIn
      B- /session --> To access the function getSession
  2. product.routes.js:
    It has the following route:
      A- /getProducts to access the function of getProducts in the products controller file.

==Frontend==
In the frontend there is the context/auth.tsx where it check sthe state of authentication of the user and redirect to the correct page based on that state. If the user is signed in it will redirect to the inventory page, if not then it will redirect to the signin page.

There is the following functions Context/auth.tsx:
  1- signIn
    It sends a request to our backend to the backend route http://localhost:3000/api/auth/signin and sends the parameters of email and password that the user entered in the sign in page and then waits for the response of the backend. If response is successful then it will set the UID, name, and sessionID and sets isAuthenticated to true and saves them all into a local storage so it stays saved. 
  2- validateSession
    It is uesd to validate the session of the current user by sending a request to the backend route: http://localhost:3000/api/auth/session, if the response is not ok then it logs out the user as the session cookie is invalid.
  3- signOut
    Used to sign out of the web app. It simply removes the sessionId, UID, name from the local storage.



In the file App.tsx it holds the routes of the frontend which are:
    <Routes>
      <Route path="/inventory" element={<Inventory />} />
      <Route path="/signin" element={<Signin />} />
    </Routes>

And it also has a useEffect function that checks the auth context, if isAuthenticated is true then it redirects to inventory page and if it is false then it redirects to signin page.


In the Sign In page there is a simple form where the user can put his email and password and then click on sign in, it will call the signIn function in the file Context/auth.tsx which calls the backend route.



==Inventory page==
There is a header with title inventory and the refresh button and a sign out button. The refresh button will call the backend endpoint to fetch the products again, and the signout button would clear the user session ID and all other user's info that was saved in context/auth.tsx.
Under it is the product records which is from the component <ProductRecords/>. Each product has the following fields: ['name', 'default_code', 'qty_available', 'virtual_available', 'list_price', 'standard_price', 'image_1920' ,'categ_id', 'weight', 'sale_ok', ]. In the table each product has the image on the left, the image is retrieved from odoo as a base64 and is called like this: `data:image/webp;base64,${product.image_1920}`. Then we have the product name and display price. Then we have the available quantity which is shown in green if the quantity is 100 and above and is in red color if the quantity is less than 100, visualizing that this product is low in stock. Then we have the status which is the field sale_ok which is a boolean, if it is true then it shows a green text of active, and if false then it will be in red color text "Inactive". And then the category. When the record is clicked the view of that record is expanded and will showa bigger view of the product image, and green pill if the product is active and red pill if the product is inactive and if the quantity available is less than 100 then it will show red pill with low stock text , and more info that was retrieved from the backend is shown as well such as weight, cost price, and the profit which is list_price - standard_price. Each one of the titles in the header is clickable and when clicked it will sort the records based on that column from a-z or z-a when clicked again. We have a search bar that the user can input any text and it will show the records based on that. In addition we have a dropdown that when clicked opens a modal that shows a list of the ddistinct values of the categories of the products results, when clicked it will show the products in that category. only. In the end of theproduct records there is a choice of number of rows to be shown per page. On the right we have next and previous buttons which navigates to the next or previous page of records.

Tailwind CSS styling is used for stylings. I have used icons from lucide-icons. Frontend is Vite React. Backend is NodeJS.


==Run project==

Before running the project, you should create a .env file inside the backend directory and have the following in it:
URL=https://egy.thetalenter.net
ODOO_DB=odoodb1

You will need 2 terminals to run this project:
  1- Frontend: cd root directory and then run command "npm run dev" -- will be running on http://localhost:5173/
  2- Backend: cd backend folder in the root directory and run command "npm run dev" will be running http://localhost:3000/

To access the react front end after running these 2 command, open the url http://localhost:5173/

