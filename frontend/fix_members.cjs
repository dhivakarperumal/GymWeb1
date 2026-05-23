const fs = require('fs');
const path = require('path');
const file = 'd:/Q Techx Projects/Q Techx Mobile App/GYMWEBNEW1/Gyms_Web_App-Backend_FrontendAdmin/frontend/src/Admin/Members/Members.jsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add useLocation and useAuth imports
code = code.replace(/useSearchParams \} from "react-router-dom";/, 'useSearchParams, useLocation } from "react-router-dom";\nimport { useAuth } from "../../PrivateRouter/AuthContext";');

// 2. Add basePath and useAuth hooks
code = code.replace(/const navigate = useNavigate\(\);/, 'const navigate = useNavigate();\n  const location = useLocation();\n  const basePath = location.pathname.includes("/trainer") ? "/trainer" : "/admin";\n  const { user, role } = useAuth();');

// 3. Update fetchMembers properly matching EXACTLY
const fetchTarget = `  // 🔄 FETCH MEMBERS
  const fetchMembers = async () => {
    if (cache.adminMembers) {
      setMembers(cache.adminMembers.filter((m) => m.source !== "users"));
    } else {
      setLoading(true);
    }

    try {
      const res = await api.get("/members");
      const data = Array.isArray(res.data) ? res.data : [];
      const onlyGymMembers = data.filter((m) => m.source !== "users");
      setMembers(onlyGymMembers);
      cache.adminMembers = onlyGymMembers;
    } catch {`;

const fetchReplace = `  // 🔄 FETCH MEMBERS
  const fetchMembers = async () => {
    if (cache.adminMembers && role !== "trainer") {
      setMembers(cache.adminMembers.filter((m) => m.source !== "users"));
    } else {
      setLoading(true);
    }

    try {
      let query = "/members";
      if (role === "trainer" && user?.id) {
        query = \`/members?trainerUserId=\${user.id}\`;
      }
      const res = await api.get(query);
      const data = Array.isArray(res.data) ? res.data : [];
      const onlyGymMembers = data.filter((m) => m.source !== "users");
      setMembers(onlyGymMembers);
      
      if (role !== "trainer") {
        cache.adminMembers = onlyGymMembers;
      }
    } catch {`;

if (code.includes(fetchTarget)) {
    code = code.replace(fetchTarget, fetchReplace);
} else {
    console.error("COULD NOT FIND fetchMembers TARGET TO REPLACE!");
}

// 4. Replace fixed paths
code = code.replace(/navigate\("\/admin\/(.*?)"\)/g, 'navigate(`${basePath}/$1`)');
code = code.replace(/navigate\(`\/admin\/(.*?)`\)/g, 'navigate(`${basePath}/$1`)');
code = code.replace(/navigate\("\/admin\/buyplanadmin", \{ state: \{ member: m \} \}\)/g, 'navigate(`${basePath}/buyplanadmin`, { state: { member: m } })');
code = code.replace(/navigate\("\/admin\/buyplanadmin", \{ state: \{ member: m, forceChange: true \} \}\)/g, 'navigate(`${basePath}/buyplanadmin`, { state: { member: m, forceChange: true } })');

// 5. Handle window.open
code = code.replace(/window\.open\(`\/admin\/(.*?)`,\s*'_blank'\)/g, "window.open(`${basePath}/$1`, '_blank')");

fs.writeFileSync(file, code);
console.log("Done");
