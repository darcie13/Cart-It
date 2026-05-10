/**
 * Archive Page
 * Displays permanently archived wishlists.
 * Users can delete individual lists or empty entire archive.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './sidebar';
import {
  getArchivedWishlists,
  deleteWishlist,
  bulkDeleteWishlists,
  getWishlists
} from '../services/api';
import { LuTrash2 } from "react-icons/lu";
import '../styles/archive.css';

const Archive = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [archivedLists, setArchivedLists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [wishlists, setWishlists] = useState([]);


  // Auth + load archived wishlists
  useEffect(() => {
    const savedUser = localStorage.getItem('user');

    if (!savedUser) {
      navigate('/login');
      return;
    }

    const userData = JSON.parse(savedUser);
    setUser(userData);

    const loadData = async () => {
      try {
        const [archived, activeWishlists] = await Promise.all([
            getArchivedWishlists(userData.user_id),
            getWishlists(userData.user_id)
        ]);
        setArchivedLists(archived || []);
        setWishlists(activeWishlists || []);
      } catch (err) {
        console.error("Failed to load archive:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  // Delete single wishlist
  const handleDelete = async (wishlistId) => {
    try {
      await deleteWishlist(wishlistId, user.user_id);

      setArchivedLists(prev =>
        prev.filter(list => list.wishlist_id !== wishlistId)
      );

      setConfirmDeleteId(null);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // Empty entire archive
  const handleEmptyTrash = async () => {
    try {
      const ids = archivedLists.map(list => list.wishlist_id);

      await bulkDeleteWishlists(ids, user.user_id);

      setArchivedLists([]);
      setConfirmEmpty(false);
    } catch (err) {
      console.error("Failed to empty archive:", err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Unknown";
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="page-wrapper">

      {/* Sidebar */}
      <div className="sidebar-container-wrapper">
        <Sidebar wishlists={wishlists}
            archivedCount={archivedLists.length}
            showExtension={false}
        />
      </div>

      {/* Main Content */}
      <main className="detail-main">

        {/* Header */}
        <header className="archive-header">
          <div>
            <h1>Archive</h1>
            <p>Deleted wishlists are permanently stored here.</p>
          </div>

          {archivedLists.length > 0 && (
            <button
              className="empty-trash-btn"
              onClick={() => setConfirmEmpty(true)}
            >
              <LuTrash2 size={16} /> Empty Trash
            </button>
          )}
        </header>

        {/* Loading */}
        {isLoading && archivedLists.length === 0 && (
        <div className="archive-state">Loading archive...</div>
        )}

        {/* Empty state */}
        {!isLoading && archivedLists.length === 0 && (
          <div className="archive-state">
            Your archive is empty.
          </div>
        )}

        {/* Grid */}
        <div className="archive-grid">
          {archivedLists.map(list => (
            <div key={list.wishlist_id} className="archive-card cursor-pointer hover:shadow-md transition"
            onClick={() => navigate(`/archive/${list.wishlist_id}`)}>

              <div className="archive-info">
                <h3>{list.name}</h3>

                {/* consistent safe fallback */}
                <p>{list.total_items ?? 0} items</p>

                <span className="archived-date">
                  Archived on {formatDate(list.archived_at)}
                </span>
              </div>

              <div className="archive-actions">
                <button
                  className="delete-btn"
                  onClick={() => setConfirmDeleteId(list.wishlist_id)}
                >
                  <LuTrash2 size={16} /> Delete
                </button>
              </div>

              {/* Confirm single delete */}
              {confirmDeleteId === list.wishlist_id && (
                <div className="confirm-box">
                  <p>Permanently delete this wishlist?</p>

                  <div className="confirm-actions">
                    <button onClick={() => setConfirmDeleteId(null)}>
                      Cancel
                    </button>
                    <button
                      className="danger"
                      onClick={() => handleDelete(list.wishlist_id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}

            </div>
          ))}
        </div>

        {/* Empty trash confirm */}
        {confirmEmpty && (
          <div className="confirm-overlay">
            <div className="confirm-box">
              <p>This will permanently delete ALL archived wishlists.</p>

              <div className="confirm-actions">
                <button onClick={() => setConfirmEmpty(false)}>
                  Cancel
                </button>
                <button className="danger" onClick={handleEmptyTrash}>
                  Empty Trash
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default Archive;