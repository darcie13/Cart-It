/**
 * ArchivedWishlistView
 * Read-only view for archived wishlists.
 * Displays full item breakdown, pricing summary, and item grid without edit capabilities.
 * Includes sidebar navigation and fetches both wishlist metadata and global user wishlists
 * for consistent navigation context.
 */

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "./sidebar";
import ItemDetailModal from "./item-modal";
import { getWishlistDetails, getWishlistItems, getWishlists } from "../services/api";
import { LuArrowLeft } from "react-icons/lu";
import "../styles/detail-view.css";

const ArchivedWishlistView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [wishlistInfo, setWishlistInfo] = useState(null);
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [wishlists, setWishlists] = useState([]);

  useEffect(() => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return navigate("/login");

  const load = async () => {
    try {
      const [details, itemsList, activeWishlists] = await Promise.all([
        getWishlistDetails(id, user.user_id),
        getWishlistItems(id),
        getWishlists(user.user_id) 
      ]);

      setWishlistInfo(details);
      setItems(itemsList);
      setWishlists(activeWishlists || []); 

    } catch (err) {
      console.error("Failed loading archived wishlist view:", err);
    } finally {
      setIsLoading(false);
    }
  };

  load();
}, [id, navigate]);


  if (!wishlistInfo) return null;

  const total = items.reduce((sum, i) => sum + parseFloat(i.price || 0), 0);

  return (
    <div className="page-wrapper">
      <div className="sidebar-container-wrapper">
        <Sidebar wishlists={wishlists} showExtension={false} />
      </div>

      <main className="detail-main">
        {isLoading && (
    <div className="animate-pulse text-gray-400">
  Loading wishlist...
</div>
  )}
        {/* Header */}
        <header className="mb-8">
          <button onClick={() => navigate("/archive")} className="back-link">
            <LuArrowLeft /> Back to Archive
          </button>

          <h1 className="text-3xl font-bold">{wishlistInfo.name}</h1>

          <p className="text-gray-500 text-sm mt-2">
            Archived view • {items.length} items • ${total.toFixed(2)} total
          </p>
        </header>

        {/* Grid */}
        <section className="item-grid">
          {items.map((item) => (
            <div
              key={item.item_id}
              className="item-card opacity-80 cursor-pointer"
              onClick={() => setSelectedItem(item)}
            >
              <div className="img-wrapper">
                <img src={item.image_url} alt={item.product_name} />
              </div>

              <div className="item-details">
                <p className="store">{item.store_name}</p>
                <h3 className="name">{item.product_name}</h3>
                <p className="price">${parseFloat(item.price).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Read-only modal (no actions passed) */}
        {selectedItem && (
          <ItemDetailModal
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
            isArchived={true}
            onMarkPurchased={null}
            onDelete={null}
            onAddNote={null}
            onDeleteComment={null}
          />
        )}
      </main>
    </div>
  );
};

export default ArchivedWishlistView;