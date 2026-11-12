// All calls to the Django backend go through here.
// Change this if your backend runs on a different port.
const API_BASE = "https://bazaarly-fullstack.vercel.app/api";

function authHeaders(){
  const token = localStorage.getItem("bazaarly_token");
  return token ? { "Authorization": "Bearer " + token } : {};
}

async function handleResponse(res){
  const data = await res.json().catch(() => ({}));
  if(!res.ok){
    throw new Error(data.error || "Something went wrong. Please try again.");
  }
  return data;
}

const api = {
  getProducts(category, search){
    const params = new URLSearchParams();
    if(category && category !== "All") params.set("category", category);
    if(search) params.set("search", search);
    const qs = params.toString();
    return fetch(`${API_BASE}/products/${qs ? "?" + qs : ""}`).then(handleResponse);
  },

  register(name, email, password){
    return fetch(`${API_BASE}/auth/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    }).then(handleResponse);
  },

  login(email, password){
    return fetch(`${API_BASE}/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).then(handleResponse);
  },

  placeOrder(items, address){
    return fetch(`${API_BASE}/orders/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ items, address }),
    }).then(handleResponse);
  },

  myOrders(){
    return fetch(`${API_BASE}/orders/mine/`, {
      headers: authHeaders(),
    }).then(handleResponse);
  },
};
