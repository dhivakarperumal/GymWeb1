// import { StrictMode } from "react";
// import { createRoot } from "react-dom/client";
// import "./index.css";
// import App from "./App.jsx";
// import { createBrowserRouter, RouterProvider } from "react-router-dom";
// import Home from "./Home/Home.jsx";
// import { AuthProvider } from "./PrivateRouter/AuthContext.jsx";
// import PrivateRoute from "./PrivateRouter/PrivateRouter.jsx";

// import { Toaster, toast } from "react-hot-toast";
// import Login from "./Components/Login.jsx";
// import Register from "./Components/Register.jsx";
// import Products from "./Pages/Products.jsx";
// import ProductDetails from "./Components/ProductDetails.jsx";
// import Cart from "./Components/Cart.jsx";


// // // Admin
// import AdminPanel from "./Admin/AdminPanel.jsx";
// import Dashboard from "./Admin/Dashboard/Dashboard.jsx";

// import Equipment from "./Admin/Equipment/Equipment.jsx";
// import Reports from "./Admin/Reports/Reports.jsx";
// import Settings from "./Admin/Settingss/Settings.jsx"



// import AddEditEquipment from "./Admin/Equipment/AddEquipments.jsx";
// import ViewEquipment from "./Admin/Equipment/ViewEquipment.jsx";
// import ProfileSettings from "./Admin/Settingss/ProfileSettings.jsx";

// // import BillingSettings from "./Admin/Settingss/BillingSettings.jsx";
// import UserManagement  from "./Admin/Settingss/UserManagement.jsx";

// import Staffs from "./Admin/Staff/Staffs.jsx";
// import AddEditStaff from "./Admin/Staff/AddStaff.jsx";
// import ViewStaff from "./Admin/Staff/ViewStaff.jsx";
// import Users from "./Admin/Users/Users.jsx";

// import ReviewsSettings from "./Admin/Settingss/Review.jsx";




// import OverallAttendance from "./Admin/Attendance/OverallAttendance.jsx";
// import AllProducts from "./Admin/Products/AllProducts.jsx";
// import AddProducts from "./Admin/Products/AddProducts.jsx";
// import AllOrders from "./Admin/Orders/All Orders.jsx";
// import Members from "./Admin/Members/Members.jsx"
// import AddMember from "./Admin/Members/AddMembers.jsx";
// import AddStock from "./Admin/Products/AddStock.jsx";
// import StockDetails from "./Admin/Products/Stockdetails.jsx";
// import PlansAll from "./Admin/Plans/PlansPage.jsx";
// import AddEditGymPlan from "./Admin/Plans/AddPlans.jsx";
// import AddEditFacility from "./Admin/Fecilieties/Addfecilities.jsx";
// import FacilitiesAll from "./Admin/Fecilieties/Fecilitiesall.jsx";
// import ServicesList from "./Admin/Servicess/servicesAll.jsx";
// import AddServices from "./Admin/Servicess/AddService.jsx";
// import OrderDetails from "./Admin/Orders/OrderDetails.jsx";
// import ProductDetail from "./Admin/Products/ProductDetail.jsx";
// import MemberAttendance from "./Admin/Staff/Memberattendance.jsx";

// import BuyPlanadmin from "./Admin/Plans/BuyPlan.jsx";


// // Trainer Admin Panel
// import TrainerAdminPanel from "./TrainerAdminPanel/TrainerAdminPanel.jsx";
// import TrainerDashboard from "./TrainerAdminPanel/TrainerDashboard/TrainerDashboard.jsx";
// import Payments from "./Admin/Payments/Payments.jsx";
// import AddWorkout from "./TrainerAdminPanel/AddWrokouts/AddWorkout.jsx";
// import AllWorkouts from "./TrainerAdminPanel/AddWrokouts/AllWorkouts.jsx";
// import AddDietPlans from "./TrainerAdminPanel/DietPlans/AddDietPlans.jsx";
// import AllDietPlans from "./TrainerAdminPanel/DietPlans/AllDietPlans.jsx";
// import TrainerOverallAttendance from "./TrainerAdminPanel/TrainerAttendance/OverallAttendance.jsx";
// import TrainerReports from "./TrainerAdminPanel/TrainerReports/Reports.jsx";
// import AssingnedTrainers from "./Admin/Payments/AssingnedTrainers.jsx";
// import GymWorkoutManager from "./Admin/CommenWorkDiet/CommenWorkDiet.jsx";


// const router = createBrowserRouter([
//   {
//     path: "/",
//     element: <App />,
//     children: [
//       { path: "/", element: <Home /> },
//       { path: "/login", element: <Login /> },
//       { path: "/register", element: <Register /> },
//       { path: "/products", element: <Products /> },
//       { path: "/products/:id", element: <ProductDetails /> },
//       { path: "/cart", element: <Cart /> },
//     ],
// },




//   {
//     path: "/admin",
//     element: (
//       <PrivateRoute allowedRoles={["admin"]}>
//         <AdminPanel />
//       </PrivateRoute>
//     ),
//     children: [
//       { index: true, element: <Dashboard /> },
//       { path: "products", element: <AllProducts /> },
//       { path: "products/:id", element: <AllProducts /> },
//       { path: "productdetail/:id", element: <ProductDetail /> },
//       { path: "addproducts", element: <AddProducts /> },
//       { path: "addproducts/:id", element: <AddProducts /> },


//       { path: "stockdetails", element: <StockDetails /> },
//       { path: "add-stock", element: <AddStock /> },

//       { path: "orders", element: <AllOrders /> },
//       { path: "orders/:id", element: <OrderDetails /> },
//       { path: "members", element: <Members /> },
//       { path: "addmembers", element: <AddMember /> },
//       { path: "addmembers/:id", element: <AddMember /> },


//       { path: "billing", element: <Billings /> },


//       { path: "plansall", element: <PlansAll /> },
//       { path: "addplan", element: <AddEditGymPlan /> },
//       { path: "addplan/:id", element: <AddEditGymPlan /> },

//       { path: "fecilities", element: <FacilitiesAll /> },
//       { path: "addfecilities", element: <AddEditFacility /> },
//       { path: "addfecilities/:id", element: <AddEditFacility /> },




//       { path: "equipment", element: <Equipment /> },
//       { path: "addequipment", element: <AddEditEquipment /> },
//       { path: "addequipment/:id", element: <AddEditEquipment /> },
//       { path: "viewequipment/:id", element: <ViewEquipment /> },


//       { path: "reports", element: <Reports /> },
//       { path: "overall-attendance", element: <OverallAttendance /> },
//       { path: "users", element: <Users /> },
//       { path: "settings", element: <Settings /> },
//       { path: "settings/profile", element: <ProfileSettings /> },
//       { path: "settings/servicelist", element: <ServicesList /> },
//       { path: "addservice", element: <AddServices /> },
//       { path: "addservice/:id", element: <AddServices /> },

//       { path: "commenworkoutdiet", element: <GymWorkoutManager /> },


//       { path: "settings/usermanagement", element: <UserManagement /> },
//       { path: "settings/reviews", element: <ReviewsSettings /> },

//       { path: "staff", element: <Staffs /> },
//       { path: "addstaff", element: <AddEditStaff /> },
//       { path: "addstaff/:id", element: <AddEditStaff /> },
//       { path: "viewstaff/:id", element: <ViewStaff /> },
//       { path: "assignedtrainers", element: <AssingnedTrainers /> },
//       { path: "payments", element: <Payments /> },
//       { path: "buyplanadmin", element: <BuyPlanadmin /> },

//     ],
//   },


//   {
//     path: "/trainer",
//     element: (
//       <PrivateRoute allowedRoles={["trainer"]}>
//         <TrainerAdminPanel />
//       </PrivateRoute>
//     ),
//     children: [
//       { index: true, element: <TrainerDashboard /> },
//       { path: "reports", element: <TrainerReports /> },
//       { path: "overall-attendance", element: <TrainerOverallAttendance /> },
//       { path: "addworkouts", element: <AddWorkout /> },
//       { path: "addworkouts/:id", element: <AddWorkout /> },
//       { path: "alladdworkouts", element: <AllWorkouts /> },
//       { path: "adddietplans", element: <AddDietPlans /> },
//       { path: "adddietplans/:id", element: <AddDietPlans /> },
//       { path: "alladddietplans", element: <AllDietPlans /> },

//       { path: "settings", element: <Settings /> },
//       { path: "settings/profile", element: <ProfileSettings /> },



//       { path: "settings/usermanagement", element: <UserManagement /> },
//       { path: "settings/reviews", element: <ReviewsSettings /> },




//       { path: "member-attendance", element: <MemberAttendance /> },



//     ],
//   },

// //   { path: "/*", element: <NotFound /> },


// ])

// createRoot(document.getElementById("root")).render(
//   <StrictMode>
//       <AuthProvider>
//          {/* 🔔 GLOBAL TOASTER */}
//         <Toaster
//           position="top-left"
//           reverseOrder={false}
//           toastOptions={{
//             duration: 4000,
//             style: {
//               borderRadius: "12px",
//               background: "#0B3C8A",
//               color: "#fff",
//             },
//             success: {
//               iconTheme: {
//                 primary: "#7CB9FF",
//                 secondary: "#fff",
//               },
//             },
//             error: {
//               style: {
//                 background: "#DC2626",
//               },
//             },
//           }}
//         />
//         <RouterProvider router={router} />
//       </AuthProvider>
//     </StrictMode>
// );



import { StrictMode, lazy } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./Home/Home.jsx";
import { AuthProvider } from "./PrivateRouter/AuthContext.jsx";
import PrivateRoute from "./PrivateRouter/PrivateRouter.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";

import { Toaster, toast } from "react-hot-toast";

// Lazy load components
const Login = lazy(() => import("./Components/Login.jsx"));
const Register = lazy(() => import("./Components/Register.jsx"));
const TrainerDetails = lazy(() => import("./Components/TrainersDetails.jsx"));
const Trainers = lazy(() => import("./Components/Trainers.jsx"));
const Facilities = lazy(() => import("./Components/Facilities.jsx"));
const FacilityDetail = lazy(() => import("./Components/FacilityDetail.jsx"));
const Pricing = lazy(() => import("./Components/Pricing.jsx"));
const BuyPlan = lazy(() => import("./Components/BuyPlan.jsx"));
const Products = lazy(() => import("./Pages/Products.jsx"));
const Services = lazy(() => import("./Components/Services.jsx"));
const ServicesDetails = lazy(() => import("./Components/ServicesDetails.jsx"));
const ProductDetails = lazy(() => import("./Components/ProductDetails.jsx"));
const Cart = lazy(() => import("./Components/Cart.jsx"));
const ClassesTable = lazy(() => import("./Components/ClassesTable.jsx"));
const Contact = lazy(() => import("./Components/Contact.jsx"));
const Account = lazy(() => import("./Components/Account.jsx"));
const Checkout = lazy(() => import("./Components/Checkout.jsx"));

// // Admin
const AdminPanel = lazy(() => import("./Admin/AdminPanel.jsx"));
const Dashboard = lazy(() => import("./Admin/Dashboard/Dashboard.jsx"));
const Billings = lazy(() => import("./Admin/Billing/Billing.jsx"));
const Equipment = lazy(() => import("./Admin/Equipment/Equipment.jsx"));
const Reports = lazy(() => import("./Admin/Reports/Reports.jsx"));
const Settings = lazy(() => import("./Admin/Settingss/Settings.jsx"));
const Enquiry = lazy(() => import("./Admin/Enquiry/Enquiry.jsx"));

const AddEditEquipment = lazy(() => import("./Admin/Equipment/AddEquipments.jsx"));

const ProfileSettings = lazy(() => import("./Admin/Settingss/ProfileSettings.jsx"));
const UserManagement = lazy(() => import("./Admin/Settingss/UserManagement.jsx"));
const Staffs = lazy(() => import("./Admin/Staff/Staffs.jsx"));
const AddEditStaff = lazy(() => import("./Admin/Staff/AddStaff.jsx"));
const ViewStaff = lazy(() => import("./Admin/Staff/ViewStaff.jsx"));
const Users = lazy(() => import("./Admin/Users/Users.jsx"));
const ReviewsSettings = lazy(() => import("./Admin/Settingss/Review.jsx"));

const OverallAttendance = lazy(() => import("./Admin/Attendance/OverallAttendance.jsx"));
const AllProducts = lazy(() => import("./Admin/Products/AllProducts.jsx"));
const AddProducts = lazy(() => import("./Admin/Products/AddProducts.jsx"));
const AllOrders = lazy(() => import("./Admin/Orders/All Orders.jsx"));
const Members = lazy(() => import("./Admin/Members/Members.jsx"));
const AddMember = lazy(() => import("./Admin/Members/AddMembers.jsx"));
const AddStock = lazy(() => import("./Admin/Products/AddStock.jsx"));
const StockDetails = lazy(() => import("./Admin/Products/Stockdetails.jsx"));
const SendMessage = lazy(() => import("./Admin/Message/SendMessage.jsx"));
const PlansAll = lazy(() => import("./Admin/Plans/PlansPage.jsx"));
const AddEditGymPlan = lazy(() => import("./Admin/Plans/AddPlans.jsx"));
const AddEditFacility = lazy(() => import("./Admin/Fecilieties/Addfecilities.jsx"));
const FacilitiesAll = lazy(() => import("./Admin/Fecilieties/Fecilitiesall.jsx"));
const ServicesList = lazy(() => import("./Admin/Servicess/servicesAll.jsx"));
const AddServices = lazy(() => import("./Admin/Servicess/AddService.jsx"));
const OrderDetails = lazy(() => import("./Admin/Orders/OrderDetails.jsx"));
const ProductDetail = lazy(() => import("./Admin/Products/ProductDetail.jsx"));
const MemberAttendance = lazy(() => import("./Admin/Staff/Memberattendance.jsx"));
const BuyPlanadmin = lazy(() => import("./Admin/Plans/BuyPlan.jsx"));

// Trainer Admin Panel
const TrainerAdminPanel = lazy(() => import("./TrainerAdminPanel/TrainerAdminPanel.jsx"));
const TrainerDashboard = lazy(() => import("./TrainerAdminPanel/TrainerDashboard/TrainerDashboard.jsx"));
const Payments = lazy(() => import("./Admin/Payments/Payments.jsx"));
const AddWorkout = lazy(() => import("./TrainerAdminPanel/AddWrokouts/AddWorkout.jsx"));
const AllWorkouts = lazy(() => import("./TrainerAdminPanel/AddWrokouts/AllWorkouts.jsx"));
const AddDietPlans = lazy(() => import("./TrainerAdminPanel/DietPlans/AddDietPlans.jsx"));
const AllDietPlans = lazy(() => import("./TrainerAdminPanel/DietPlans/AllDietPlans.jsx"));
const TrainerOverallAttendance = lazy(() => import("./TrainerAdminPanel/TrainerAttendance/OverallAttendance.jsx"));
const TrainerReports = lazy(() => import("./TrainerAdminPanel/TrainerReports/Reports.jsx"));
const TrainerSendMessage = lazy(() => import("./TrainerAdminPanel/TrainerSendMessage/TrainerSendMessage.jsx"));
const AssingnedTrainers = lazy(() => import("./Admin/Payments/AssingnedTrainers.jsx"));
const GymWorkoutManager = lazy(() => import("./Admin/CommenWorkDiet/CommenWorkDiet.jsx"));
const UpdateWeight = lazy(() => import("./TrainerAdminPanel/UpdateWeight/UpdateWeight.jsx"));


const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/trainers", element: <Trainers /> },
      { path: "trainersdetails/:id", element: <TrainerDetails /> },
      { path: "facilities", element: <Facilities /> },
      { path: "account", element: <Account /> },
      { path: "facilities/:slug", element: <FacilityDetail /> },
      { path: "pricing", element: <Pricing /> },
      { path: "buy-plan", element: <BuyPlan /> },
      { path: "products", element: <Products /> },
      { path: "/cart", element: <Cart /> },
      { path: "/checkout", element: <Checkout /> },
      { path: "/products/:id", element: <ProductDetails /> },
      { path: "/services", element: <Services /> },
      { path: "/services/:slug", element: <ServicesDetails /> },
      { path: "/calendar", element: <ClassesTable /> },
      { path: "/contact", element: <Contact /> },
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
    ]
  },


  {
    path: "/admin",
    element: (
      <PrivateRoute allowedRoles={["admin"]}>
        <AdminPanel />
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: "products", element: <AllProducts /> },
      { path: "products/:id", element: <AllProducts /> },
      { path: "productdetail/:id", element: <ProductDetail /> },
      { path: "addproducts", element: <AddProducts /> },
      { path: "addproducts/:id", element: <AddProducts /> },


      { path: "stockdetails", element: <StockDetails /> },
      { path: "add-stock", element: <AddStock /> },

      { path: "orders", element: <AllOrders /> },
      { path: "orders/:id", element: <OrderDetails /> },
      { path: "members", element: <Members /> },
      { path: "addmembers", element: <AddMember /> },
      { path: "addmembers/:id", element: <AddMember /> },
      { path: "send-message", element: <SendMessage /> },

      { path: "billing", element: <Billings /> },


      { path: "plansall", element: <PlansAll /> },
      { path: "addplan", element: <AddEditGymPlan /> },
      { path: "addplan/:id", element: <AddEditGymPlan /> },

      { path: "fecilities", element: <FacilitiesAll /> },
      { path: "addfecilities", element: <AddEditFacility /> },
      { path: "addfecilities/:id", element: <AddEditFacility /> },




      { path: "equipment", element: <Equipment /> },
      { path: "addequipment", element: <AddEditEquipment /> },
      { path: "addequipment/:id", element: <AddEditEquipment /> },



      { path: "reports", element: <Reports /> },
      { path: "enquiry", element: <Enquiry /> },
      { path: "overall-attendance", element: <OverallAttendance /> },
      { path: "member-attendance", element: <MemberAttendance /> },
      { path: "users", element: <Users /> },
      { path: "settings", element: <Settings /> },
      { path: "settings/profile", element: <ProfileSettings /> },
      { path: "settings/servicelist", element: <ServicesList /> },
      { path: "addservice", element: <AddServices /> },
      { path: "addservice/:id", element: <AddServices /> },

      { path: "commenworkoutdiet", element: <GymWorkoutManager /> },


      { path: "settings/usermanagement", element: <UserManagement /> },
      { path: "settings/reviews", element: <ReviewsSettings /> },

      { path: "staff", element: <Staffs /> },
      { path: "addstaff", element: <AddEditStaff /> },
      { path: "addstaff/:id", element: <AddEditStaff /> },
      { path: "viewstaff/:id", element: <ViewStaff /> },
      { path: "assignedtrainers", element: <AssingnedTrainers /> },
      { path: "payments", element: <Payments /> },
      { path: "buyplanadmin", element: <BuyPlanadmin /> },

    ],
  },


  {
    path: "/trainer",
    element: (
      <PrivateRoute allowedRoles={["trainer"]}>
        <TrainerAdminPanel />
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <TrainerDashboard /> },
      { path: "reports", element: <TrainerReports /> },
      { path: "overall-attendance", element: <TrainerOverallAttendance /> },
      { path: "addworkouts", element: <AddWorkout /> },
      { path: "addworkouts/:id", element: <AddWorkout /> },
      { path: "alladdworkouts", element: <AllWorkouts /> },
      { path: "adddietplans", element: <AddDietPlans /> },
      { path: "adddietplans/:id", element: <AddDietPlans /> },
      { path: "alladddietplans", element: <AllDietPlans /> },
      { path: "update-weight", element: <UpdateWeight /> },
      { path: "send-message", element: <TrainerSendMessage /> },

      { path: "settings", element: <Settings /> },
      { path: "settings/profile", element: <ProfileSettings /> },



      { path: "settings/usermanagement", element: <UserManagement /> },
      { path: "settings/reviews", element: <ReviewsSettings /> },




      { path: "member-attendance", element: <MemberAttendance /> },



    ],
  },

  //   { path: "/*", element: <NotFound /> },


])

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="788596465962-h22auho4kp5sfnuc59udl0k10e8uu6ra.apps.googleusercontent.com">
      <AuthProvider>
        {/* 🔔 GLOBAL TOASTER */}
        <Toaster
          position="top-left"
          reverseOrder={false}
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: "12px",
              background: "#0B3C8A",
              color: "#fff",
            },
            success: {
              iconTheme: {
                primary: "#7CB9FF",
                secondary: "#fff",
              },
            },
            error: {
              style: {
                background: "#DC2626",
              },
            },
          }}
        />
        <RouterProvider router={router} />
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);

