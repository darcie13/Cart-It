/**
 * Dashboard Component
 * The primary landing page for authenticated users.
 * Features a quad-image wishlist preview and a branded "New List" trigger.
 * Also features at-a-glance look at recent cart items and sparkline graph for spending analytics.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './sidebar';
import { LuPlus, LuUsers, LuTrendingUp, LuShoppingCart, LuDollarSign, LuCircleHelp } from "react-icons/lu";
import { getWishlists, getCartItems, createWishlist, getNotifications, getAuthHeader } from '../services/api';
import '../styles/dashboard.css';


const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null); // Current authenticated user
  const [wishlists, setWishlists] = useState([]); // List of owned and shared collections
  const [isModalOpen, setIsModalOpen] = useState(false); // Toggle for creation modal
  const [newWishlistName, setNewWishlistName] = useState(""); // Input for new list naming
  const [items, setItems] = useState([]); // Recent items for activity feed
  const [notifications, setNotifications] = useState([]); // Notifications
  const [notifFilter, setNotifFilter] = useState("all"); // Filters notification card for price drops or collaboration activity
  const [toast, setToast] = useState(null); // Toast for completed wishlist
  const sortedNotifications = React.useMemo(() => {
  return [...notifications].sort((a, b) => {
    const aDate = new Date(a.created_at).getTime();
    const bDate = new Date(b.created_at).getTime();
    return bDate - aDate || (b.notification_id - a.notification_id);
  });
}, [notifications]);

  const timeAgo = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diff = Math.floor((now - past) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // Effect hook to verify authentication and fetch aggregate dashboard data. Redirects to login if session data is missing.
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      navigate('/login');
    } else {
      const userData = JSON.parse(savedUser);
      setUser(userData);

      const loadDashboardData = async () => {
        try {
          const [wishlistData, cartData] = await Promise.all([
            getWishlists(userData.user_id),
            getCartItems(userData.user_id)
          ]);
          setWishlists(wishlistData);
          setItems(cartData);
        } catch (err) {
          console.error("Dashboard load error:", err);
        }
      };
      loadDashboardData();
    }
  }, [navigate]);

  // Loading notifications when user logs in
  useEffect(() => {
    if (!user?.user_id) return;

    const fetchNotifications = async () => {
      const data = await getNotifications(user.user_id, notifFilter);
      setNotifications(data || []);
    };

    fetchNotifications();
  }, [user?.user_id, notifFilter]);


  // Submits a new wishlist request to the API and updates local state.
  const handleSaveWishlist = async () => {
    if (newWishlistName.trim()) {
      try {
        const newWishlist = await createWishlist(user.user_id, newWishlistName);
        setWishlists([...wishlists, newWishlist]);
        setNewWishlistName("");
        setIsModalOpen(false);
      } catch (error) {
        console.error("Error creating wishlist:", error);
      }
    }
  };

  //Refresehes wishlist when purchased item is greyed out
  const refreshWishlists = async () => {
  if (!user?.user_id) return;

  try {
    const data = await getWishlists(user.user_id);

    // detect newly completed lists
    const newlyCompleted = data.find(
      w => w.is_completed && !wishlists.find(old => old.wishlist_id === w.wishlist_id && old.is_completed)
    );

    if (newlyCompleted) {
      handleWishlistCompletion(newlyCompleted.wishlist_id);
    }

    setWishlists(data);
  } catch (err) {
    console.error("Wishlist refresh failed:", err);
  }
};

// Helper for completed wishlists
const handleWishlistCompletion = (wishlistId) => {
  setToast({
    type: "success",
    message: "This wishlist is completed 🎉!",
    action: "archive",
    wishlistId
  });
};

useEffect(() => {
  if (!toast) return;

  const t = setTimeout(() => setToast(null), 6000);
  return () => clearTimeout(t);
}, [toast]);

// Helper to archive completed wishlists
const archiveWishlist = async (id) => {
  try {
    await fetch(`/api/wishlists/${id}/archive`, {
      method: "PATCH",
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });

    setToast(null);
    await refreshWishlists();

    navigate("/archive");
  } catch (err) {
    console.error("Archive failed", err);
  }
};

  return (
    <div className="dashboard-container">
      {/* Sidebar Container */}
      <div className="sidebar-container">
        <Sidebar wishlists={wishlists} showExtension={true} />
      </div>

      <main className="dash-main">
        {/* Welcome Header */}
        <header className="dash-header">
          <div className="dash-greeting">
            <h1 className="dash-title">Welcome back, {user ? user.username : 'User'}</h1>
            <p className="dash-subtitle">Your personal shopping lab is ready.</p>
          </div>
          {/* Help Icon */}
          <a href={`mailto:support@cart-it.com?subject=Cart-It Support Request&body=Hi Cart-It Support,%0D%0A%0D%0AI need help with:%0D%0A`} className="help-icon" title="Help">
            <LuCircleHelp size={22} />
          </a>
        </header>

        {/* Collection Grid: Contains the creation trigger and wishlist quads */}
        <section className="dash-section">
          <h2 className="section-heading">My Collections</h2>

          <div className="wishlist-grid">
            {/* Branded "Create New" Card Trigger */}
            <button onClick={() => setIsModalOpen(true)} className="create-list-card">
              <div className="plus-icon-circle">
                <LuPlus size={32} />
              </div>
              <span className="create-label">New List</span>
            </button>
    
            {wishlists.length === 0 ? (
              <p className="text-sm text-gray-400">No wishlists yet</p>
            ) : (
              wishlists.map((list) => (
              <div
                key={list.wishlist_id}
                className="dash-wishlist-card"
                onClick={() => navigate(`/wishlist/${list.wishlist_id}`)}
              >
                {/* Quad-Image Preview: Displays first 4 items or placeholders */}
                <div className="wishlist-quad">
                  {list.preview_images && list.preview_images.length > 0 ? (
                    <div className="quad-grid">
                      {list.preview_images.map((img, i) => (
                        <img key={i} src={img} alt="" className="quad-img" />
                      ))}
                      {/* Generates empty blocks if list contains fewer than 4 items */}
                      {[...Array(Math.max(0, 4 - list.preview_images.length))].map((_, i) => (
                        <div key={`empty-${i}`} className="quad-empty"></div>
                      ))}
                    </div>
                  ) : (
                    <div className="quad-placeholder">
                      <LuShoppingCart size={24} className="text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Wishlist Metadata Section */}
                <div className="wishlist-info">
                  <div className="flex justify-between items-start">
                    <span className="list-name">{list.name}</span>
                    {/* Collaborative status icon (LuUsers) shown for shared lists */}
                    {list.is_shared && (
                      <LuUsers size={16} className="text-[#4B0082] mt-1" title="Shared Wishlist" />
                    )}
                  </div>
                  {/* Change this line in your Dashboard.js */}
                  <span className="list-count">
                    {list.total_items ?? 0} items
                  </span>
                </div>
              </div>
              ))
            )}
          </div>
        </section>

        {/* Insight Section: Summarized Analytics and Recent Activity */}
        <section className="insights-grid">
          {/* Sparkline visualization linked to full Analytics suite */}
          <div className="insight-card" onClick={() => navigate('/analytics')}>
            <div className="card-top">
              <div className="flex items-center gap-2">
                <LuTrendingUp className="text-[#DB8046]" />
                <h3 className="insight-label">Expense Trends</h3>
              </div>
            </div>
            <div className="mini-graph">
              <div className="spark-bar h-8"></div>
              <div className="spark-bar h-16"></div>
              <div className="spark-bar h-12"></div>
              <div className="spark-bar h-20 active"></div>
            </div>
          </div>

           {/* Horizontal strip of latest items found in the main cart */}
          <div className="insight-card" onClick={() => navigate('/cart')}>
            <div className="card-top">
              <div className="flex items-center gap-2">
                <LuShoppingCart className="text-purple-600" />
                <h3 className="insight-label">Latest Finds</h3>
              </div>
            </div>
            <div className="recent-strip">
              {items.slice(0, 5).map(item => (
                <img key={item.item_id} src={item.image_url} alt="" className="strip-img" />
              ))}
            </div>
          </div>

          {/* Price Alerts */}
        <div className="insight-card col-span-1 md:col-span-2">
          <div className="card-top">
          <div className="flex items-center gap-2">
            <LuDollarSign className="text-[#DB8046]" />
            <div className="flex items-center justify-between w-full">
              <h3 className="insight-label">Notifications</h3>

              <select className="text-xs border rounded px-2 py-1" value={notifFilter} onChange={(e) => setNotifFilter(e.target.value)}>
                <option value="all">All</option>
                <option value="price_drop">Price Drops</option>
                <option value="collaboration_activity">Collaboration</option>
              </select>
            </div>
          </div>
        </div>

        <div className="max-h-64 overflow-y-auto flex flex-col gap-3 pr-2">
            {notifications.length === 0 ? (
            <div className="text-sm text-gray-400">
              No notifications yet
            </div>
          ) : (
          sortedNotifications.slice(0, 5).map(n => (
            <div
          key={n.notification_id}
          className={`
            text-sm p-3 rounded-xl border transition-all duration-300
            ${n.is_read ? "bg-white text-gray-600 border-gray-100" 
                        : "bg-orange-50 text-gray-800 border-orange-200 shadow-sm"}
            animate-fadeIn
          `}
        >
          <div className="flex justify-between gap-3">
            <span>
              💸 {n.message}
            </span>
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {timeAgo(n.created_at)}
            </span>
          </div>
        </div>
      ))
    )}
        </div>
      </div>
        </section>

        {toast && ( 
          <div className="fixed bottom-6 right-6 bg-white shadow-lg border rounded-xl p-4 z-50">
          <p className="text-sm font-medium">{toast.message}</p>

          {toast.action === "archive" && (
            <div className="flex gap-2 mt-2">
              <button className="text-xs bg-gray-100 px-3 py-1 rounded" onClick={() => setToast(null)} >
                Later
              </button>

              <button className="text-xs bg-orange-500 text-white px-3 py-1 rounded" onClick={() => archiveWishlist(toast.wishlistId)}>
                Archive it
              </button>
            </div>
          )}
        </div>
      )}

        {/* Wishlist Creation Modal */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 className="modal-title">Create New Wishlist</h3>
              <input
                type="text"
                placeholder="List Name"
                value={newWishlistName}
                onChange={(e) => setNewWishlistName(e.target.value)}
                autoFocus
              />
              <div className="modal-actions">
                <button onClick={() => setIsModalOpen(false)} className="btn-cancel">Cancel</button>
                <button onClick={handleSaveWishlist} className="btn-save">Create</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;