import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { createHashRouter, RouterProvider } from "react-router-dom";
import Home from "./Home/Home.jsx";
import { AuthProvider } from "./PrivateRouter/AuthContext.jsx";
import PrivateRoute from "./PrivateRouter/PrivateRouter.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";

import { Toaster, toast } from "react-hot-toast";
import UserEnquiry from "./Components/UserEnquiry.jsx";
import PTFormUser from "./Components/PTFormUser.jsx";

// 🔄 Helper for robust lazy loading (handles deployment version mismatches)
const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.error("Chunk load failed, reloading page...", error);
      // Only reload once to avoid infinite loops
      const hasReloaded = sessionStorage.getItem("chunk_reload_attempted");
      if (!hasReloaded) {
        sessionStorage.setItem("chunk_reload_attempted", "true");
        window.location.reload();
      }
      throw error;
    }
  });

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
const FollowupEnquiry = lazy(() => import("./Admin/Enquiry/FollowupEnquiry.jsx"));


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
const EMIList = lazyWithRetry(() => import("./Admin/Plans/EMIList.jsx"));
const PlanHistory = lazy(() => import("./Admin/Plans/PlanHistory.jsx"));
const TrainerReferredPlans = lazy(() => import("./Admin/Plans/TrainerReferredPlans.jsx"));
const MemberDetails = lazy(() => import("./Admin/Members/MemberDetails.jsx"));
const ExpiryMembers = lazy(() => import("./Admin/Members/ExpiryMembers.jsx"));
const Offers = lazy(() => import("./Admin/Settingss/Offers.jsx"));
const PublicOffers = lazy(() => import("./Pages/PublicOffers.jsx"));
const PublicProductOffers = lazy(() => import("./Pages/PublicProductOffers.jsx"));
const PrivacyPolicy = lazy(() => import("./Pages/PrivacyPolicy.jsx"));


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
const TrainerPricing = lazy(() => import("./TrainerAdminPanel/TrainerPricing/TrainerPricing.jsx"));
const PTForm = lazy(() => import("./Admin/PTForm/PTForm.jsx"));
const PTFormPrint = lazy(() => import("./Admin/PTForm/PTFormPrint.jsx"));
const SessionTracking = lazy(() => import("./TrainerAdminPanel/SessionTracking/SessionTracking.jsx"));



const router = createHashRouter([
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
      { path: "/userenquiry", element: <UserEnquiry /> },
      { path: "/ptformuser", element: <PTFormUser /> },
      { path: "/privacy-policy", element: <PrivacyPolicy /> },
      { path: "/offers/plans", element: <PublicOffers offerType="plan" /> },
      { path: "/offers/products", element: <PublicProductOffers /> },
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
      { path: "member_details/:id", element: <MemberDetails /> },
      { path: "expiry-members", element: <ExpiryMembers /> },
      { path: "addmembers", element: <AddMember /> },
      { path: "addmembers/:id", element: <AddMember /> },
      { path: "send-message", element: <SendMessage /> },

      { path: "billing", element: <Billings /> },


      { path: "plansall", element: <PlansAll pageTitle="Normal Plans" buttonLabel="Add Normal Plan" /> },
      { path: "pt-plans", element: <PlansAll filterTrainerPlans={true} pageTitle="PT Plans" buttonLabel="Add PT Plan" buttonPath="/admin/add-pt-plan" /> },
      { path: "addplan", element: <AddEditGymPlan /> },
      { path: "addplan/:id", element: <AddEditGymPlan /> },
      { path: "add-pt-plan", element: <AddEditGymPlan defaultTrainerIncluded={true} pageTitle="PT Plan" /> },
      { path: "add-pt-plan/:id", element: <AddEditGymPlan /> },

      { path: "fecilities", element: <FacilitiesAll /> },
      { path: "addfecilities", element: <AddEditFacility /> },
      { path: "addfecilities/:id", element: <AddEditFacility /> },




      { path: "equipment", element: <Equipment /> },
      { path: "addequipment", element: <AddEditEquipment /> },
      { path: "addequipment/:id", element: <AddEditEquipment /> },



      { path: "reports", element: <Reports /> },
      { path: "enquiry", element: <Enquiry /> },
      { path: "followupenquriy", element: <FollowupEnquiry /> },

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
      { path: "pt-form", element: <PTForm /> },
      { path: "pt-form/print/:id", element: <PTFormPrint /> },
      { path: "buyplanadmin", element: <BuyPlanadmin /> },
      { path: "buy-pt-plan", element: <BuyPlanadmin filterTrainerPlans={true} pageTitle="Buy PT Plans" /> },
      { path: "emi", element: <EMIList /> },
      { path: "plan-history", element: <PlanHistory /> },
      { path: "trainer-referred-plans", element: <TrainerReferredPlans /> },
      { path: "settings/offers", element: <Offers /> },

    ],
  },


  {
    path: "/trainer",
    element: (
      <PrivateRoute allowedRoles={["trainer", "admin"]}>
        <TrainerAdminPanel />
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <TrainerDashboard /> },
      { path: "reports", element: <TrainerReports /> },
      { path: "expiry-members", element: <ExpiryMembers /> },
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
      { path: "pt-form", element: <PTForm /> },
      { path: "pt-form/print/:id", element: <PTFormPrint /> },
      { path: "pricing", element: <TrainerPricing /> },
      { path: "followupenquriy", element: <FollowupEnquiry /> },
      { path: "session-tracking", element: <SessionTracking /> },
      { path: "buyplanadmin", element: <BuyPlanadmin /> },
      { path: "buy-pt-plan", element: <BuyPlanadmin filterTrainerPlans={true} pageTitle="Buy PT Plans" /> },
      { path: "payments", element: <Payments /> },
      { path: "members", element: <Members /> },
      { path: "member_details/:id", element: <MemberDetails /> },
      { path: "addmembers", element: <AddMember /> },
      { path: "addmembers/:id", element: <AddMember /> },
      { path: "emi", element: <EMIList /> },
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

