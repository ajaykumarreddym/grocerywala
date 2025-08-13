import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Import UI components
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Input } from './components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';

// Icons
import { 
  ShoppingCart, 
  Car, 
  Wrench, 
  Store, 
  MapPin, 
  Star, 
  Clock, 
  Phone, 
  Menu,
  X,
  User,
  BarChart3,
  Package,
  Settings
} from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

// Context for user management
const UserContext = React.createContext();

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('customer'); // customer, driver, admin
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Data states
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [cabServices, setCabServices] = useState([]);
  const [handymanServices, setHandymanServices] = useState([]);
  const [dashboardData, setDashboardData] = useState({});
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch data from API
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [storesRes, productsRes, cabRes, handymanRes, dashboardRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/stores`),
        axios.get(`${API_BASE_URL}/api/products`),
        axios.get(`${API_BASE_URL}/api/cab-services`),
        axios.get(`${API_BASE_URL}/api/handyman-services`),
        axios.get(`${API_BASE_URL}/api/analytics/dashboard`, {
          headers: { Authorization: `Bearer dummy-token` }
        })
      ]);

      setStores(storesRes.data.stores || []);
      setProducts(productsRes.data.products || []);
      setCabServices(cabRes.data.services || []);
      setHandymanServices(handymanRes.data.services || []);
      setDashboardData(dashboardRes.data || {});
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSwitch = (role) => {
    setUserRole(role);
    setIsMobileMenuOpen(false);
  };

  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, userRole, setUserRole }}>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
          {/* Header */}
          <header className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center space-x-4">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    ServiceHub
                  </h1>
                  <Badge variant="secondary" className="hidden sm:block">
                    Multi-Service Platform
                  </Badge>
                </div>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center space-x-8">
                  <Button
                    variant={userRole === 'customer' ? 'default' : 'ghost'}
                    onClick={() => handleRoleSwitch('customer')}
                    className="text-sm"
                  >
                    <User className="w-4 h-4 mr-2" />
                    User App
                  </Button>
                  <Button
                    variant={userRole === 'driver' ? 'default' : 'ghost'}
                    onClick={() => handleRoleSwitch('driver')}
                    className="text-sm"
                  >
                    <Car className="w-4 h-4 mr-2" />
                    Driver Panel
                  </Button>
                  <Button
                    variant={userRole === 'admin' ? 'default' : 'ghost'}
                    onClick={() => handleRoleSwitch('admin')}
                    className="text-sm"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Admin Panel
                  </Button>
                </nav>

                {/* Mobile menu button */}
                <Button
                  variant="ghost"
                  className="md:hidden"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </Button>
              </div>

              {/* Mobile Navigation */}
              {isMobileMenuOpen && (
                <div className="md:hidden py-4 border-t border-gray-200">
                  <div className="flex flex-col space-y-2">
                    <Button
                      variant={userRole === 'customer' ? 'default' : 'ghost'}
                      onClick={() => handleRoleSwitch('customer')}
                      className="w-full justify-start"
                    >
                      <User className="w-4 h-4 mr-2" />
                      User App
                    </Button>
                    <Button
                      variant={userRole === 'driver' ? 'default' : 'ghost'}
                      onClick={() => handleRoleSwitch('driver')}
                      className="w-full justify-start"
                    >
                      <Car className="w-4 h-4 mr-2" />
                      Driver Panel
                    </Button>
                    <Button
                      variant={userRole === 'admin' ? 'default' : 'ghost'}
                      onClick={() => handleRoleSwitch('admin')}
                      className="w-full justify-start"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Admin Panel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </header>

          <Routes>
            <Route path="/" element={<MainContent 
              userRole={userRole}
              stores={stores}
              products={products}
              cabServices={cabServices}
              handymanServices={handymanServices}
              dashboardData={dashboardData}
              orders={orders}
              loading={loading}
            />} />
          </Routes>
        </div>
      </Router>
    </UserContext.Provider>
  );
}

// Main Content Component
function MainContent({ userRole, stores, products, cabServices, handymanServices, dashboardData, orders, loading }) {
  const [selectedService, setSelectedService] = useState('grocery');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ServiceHub...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {userRole === 'customer' && <UserApp 
        stores={stores}
        products={products}
        cabServices={cabServices}
        handymanServices={handymanServices}
        selectedService={selectedService}
        setSelectedService={setSelectedService}
      />}
      {userRole === 'driver' && <DriverPanel />}
      {userRole === 'admin' && <AdminPanel dashboardData={dashboardData} stores={stores} />}
    </main>
  );
}

// User App Component
function UserApp({ stores, products, cabServices, handymanServices, selectedService, setSelectedService }) {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative px-8 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Everything You Need,
              <span className="block text-yellow-300">All in One Place</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Grocery delivery, cab booking, handyman services & e-commerce for Kadapa region
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-full text-lg font-semibold"
              >
                Start Shopping
                <ShoppingCart className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-full text-lg font-semibold"
              >
                Book a Ride
                <Car className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
        {/* Hero Image */}
        <div className="absolute right-0 top-0 h-full w-1/2 hidden lg:block">
          <img 
            src="https://images.unsplash.com/photo-1753806901333-44632dc78b49" 
            alt="Delivery services in India"
            className="w-full h-full object-cover opacity-30"
          />
        </div>
      </section>

      {/* Service Selection */}
      <section>
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Service</h2>
          <p className="text-lg text-gray-600">Explore our comprehensive range of services</p>
        </div>

        <Tabs value={selectedService} onValueChange={setSelectedService} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-2xl">
            <TabsTrigger value="grocery" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Store className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Grocery</span>
            </TabsTrigger>
            <TabsTrigger value="ecommerce" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Package className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">E-commerce</span>
            </TabsTrigger>
            <TabsTrigger value="cab" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Car className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Cab Service</span>
            </TabsTrigger>
            <TabsTrigger value="handyman" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Wrench className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Handyman</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="grocery" className="mt-8">
            <GroceryService stores={stores} products={products} />
          </TabsContent>

          <TabsContent value="ecommerce" className="mt-8">
            <EcommerceService stores={stores} products={products} />
          </TabsContent>

          <TabsContent value="cab" className="mt-8">
            <CabService services={cabServices} />
          </TabsContent>

          <TabsContent value="handyman" className="mt-8">
            <HandymanService services={handymanServices} />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}

// Grocery Service Component
function GroceryService({ stores, products }) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Fresh Groceries Delivered</h3>
        <p className="text-gray-600">Farm-fresh vegetables, fruits, and daily essentials from Kadapa's best stores</p>
      </div>

      {/* Featured Stores */}
      <div>
        <h4 className="text-xl font-semibold mb-4">Popular Stores</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.filter(store => store.category === 'grocery').map((store) => (
            <Card key={store.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 bg-white/80 backdrop-blur-sm">
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1695653422259-8a74ffe90401" 
                  alt={store.name}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <Badge className="absolute top-4 left-4 bg-green-500">
                  {store.delivery_time}
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {store.name}
                  <div className="flex items-center">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="ml-1 text-sm text-gray-600">{store.rating}</span>
                  </div>
                </CardTitle>
                <CardDescription className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  {store.location.city}, {store.location.state}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{store.description}</p>
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Shop Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Featured Products */}
      <div>
        <h4 className="text-xl font-semibold mb-4">Fresh Products</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 bg-white/90">
              <div className="relative">
                <img 
                  src={product.images[0] || "https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9"} 
                  alt={product.name}
                  className="w-full h-32 object-cover rounded-t-lg"
                />
                {product.stock < 10 && (
                  <Badge variant="destructive" className="absolute top-2 right-2 text-xs">
                    Low Stock
                  </Badge>
                )}
              </div>
              <CardHeader className="p-3">
                <CardTitle className="text-sm font-medium line-clamp-2">{product.name}</CardTitle>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-green-600">₹{product.price}</span>
                  <Button size="sm" className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700">
                    <ShoppingCart className="w-3 h-3" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// E-commerce Service Component  
function EcommerceService({ stores, products }) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Shop Everything Online</h3>
        <p className="text-gray-600">Electronics, fashion, home appliances and more with fast delivery</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stores.filter(store => store.category !== 'grocery').map((store) => (
          <Card key={store.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 bg-white/80 backdrop-blur-sm">
            <div className="relative">
              <img 
                src="https://images.pexels.com/photos/7551597/pexels-photo-7551597.jpeg" 
                alt={store.name}
                className="w-full h-48 object-cover rounded-t-lg"
              />
              <Badge className="absolute top-4 left-4 bg-blue-500">
                {store.category}
              </Badge>
            </div>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {store.name}
                <div className="flex items-center">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="ml-1 text-sm text-gray-600">{store.rating}</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{store.description}</p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <Package className="w-4 h-4 mr-2" />
                Explore Store
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Cab Service Component
function CabService({ services }) {
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Quick & Safe Rides</h3>
        <p className="text-gray-600">Book reliable cab services across Kadapa with real-time tracking</p>
      </div>

      {/* Booking Form */}
      <Card className="max-w-2xl mx-auto border-0 bg-white/80 backdrop-blur-sm shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Car className="w-5 h-5 mr-2 text-blue-600" />
            Book Your Ride
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Pickup Location</label>
            <Input 
              placeholder="Enter pickup location" 
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              className="border-gray-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Destination</label>
            <Input 
              placeholder="Where to?" 
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="border-gray-200"
            />
          </div>
          <Button className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
            Find Rides
          </Button>
        </CardContent>
      </Card>

      {/* Available Services */}
      <div>
        <h4 className="text-xl font-semibold mb-4">Available Services</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card key={service.id} className="group hover:shadow-lg transition-all duration-300 border-0 bg-white/90">
              <div className="relative">
                <img 
                  src="https://images.pexels.com/photos/34239/pexels-photo.jpg" 
                  alt={service.service_type}
                  className="w-full h-32 object-cover rounded-t-lg"
                />
                <Badge className="absolute top-4 left-4 bg-green-500">
                  {service.available_slots} Available
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="capitalize">{service.service_type}</CardTitle>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-blue-600">₹{service.base_fare}</span>
                  <span className="text-sm text-gray-600">+ ₹{service.price_per_km}/km</span>
                </div>
              </CardHeader>
              <CardContent>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <Phone className="w-4 h-4 mr-2" />
                  Book Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// Handyman Service Component
function HandymanService({ services }) {
  const categories = [...new Set(services.map(s => s.category))];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Professional Home Services</h3>
        <p className="text-gray-600">Expert handyman services for all your home repair and maintenance needs</p>
      </div>

      {/* Categories */}
      <div>
        <h4 className="text-xl font-semibold mb-4">Service Categories</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {categories.map((category) => (
            <Card key={category} className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-0 bg-white/90">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <Wrench className="w-8 h-8 text-orange-600 mb-2" />
                <span className="font-medium capitalize">{category}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Services */}
      <div>
        <h4 className="text-xl font-semibold mb-4">Available Professionals</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Card key={service.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 bg-white/80 backdrop-blur-sm">
              <div className="relative">
                <img 
                  src="https://images.pexels.com/photos/33404248/pexels-photo-33404248.jpeg" 
                  alt={service.name}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <Badge className="absolute top-4 left-4 bg-orange-500 capitalize">
                  {service.category}
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {service.name}
                  <div className="flex items-center">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="ml-1 text-sm text-gray-600">{service.rating}</span>
                  </div>
                </CardTitle>
                <CardDescription>{service.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <span className="text-lg font-bold text-orange-600">{service.price_range}</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-4">
                  {service.availability.map((slot) => (
                    <Badge key={slot} variant="outline" className="text-xs capitalize">
                      {slot}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 bg-orange-600 hover:bg-orange-700">
                    Book Service
                  </Button>
                  <Button variant="outline" size="icon">
                    <Phone className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// Driver Panel Component
function DriverPanel() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Driver Dashboard</h2>
        <p className="text-gray-600">Manage your rides and earnings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Today's Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">₹2,450</div>
            <p className="text-sm text-green-700">+15% from yesterday</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Completed Rides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">12</div>
            <p className="text-sm text-blue-700">Today</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-orange-50 to-orange-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">4.8</div>
            <div className="flex items-center mt-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm text-orange-700 ml-1">Excellent</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Online Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">8.5</div>
            <p className="text-sm text-purple-700">Hours today</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Rides */}
      <Card className="border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Active Rides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <h4 className="font-medium">Pickup: Railway Station</h4>
                <p className="text-sm text-gray-600">Destination: City Mall</p>
                <p className="text-sm text-blue-600">Customer: Ravi Kumar</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-600">₹125</div>
                <Button size="sm" className="mt-2">
                  Navigate
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Admin Panel Component
function AdminPanel({ dashboardData, stores }) {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Admin Dashboard</h2>
        <p className="text-gray-600">Monitor and manage your multi-service platform</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{dashboardData.total_users || 0}</div>
            <p className="text-sm text-blue-700">+{dashboardData.growth_rate || 0}% this month</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{dashboardData.total_orders || 0}</div>
            <p className="text-sm text-green-700">Across all services</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-orange-50 to-orange-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Active Stores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{dashboardData.total_stores || 0}</div>
            <p className="text-sm text-orange-700">Multi-vendor partners</p>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">₹{dashboardData.revenue?.toLocaleString() || 0}</div>
            <p className="text-sm text-purple-700">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Stores Management */}
      <Card className="border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Store Management</CardTitle>
          <CardDescription>Monitor and manage vendor stores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stores.map((store) => (
              <div key={store.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium">{store.name}</h4>
                  <p className="text-sm text-gray-600">{store.category} • {store.location.city}</p>
                  <div className="flex items-center mt-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm text-gray-600 ml-1">{store.rating}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={store.is_active ? "default" : "secondary"}>
                    {store.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;