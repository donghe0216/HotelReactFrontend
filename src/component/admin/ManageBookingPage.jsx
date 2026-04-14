import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../service/ApiService';
import Pagination from '../common/Pagination';

const ManageBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const bookingsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await ApiService.getAllBookings();
        setBookings(response.bookings || []);
      } catch (error) {
        console.error('Error fetching bookings:', error.message);
      }
    };

    fetchBookings();
  }, []);

  // Memoized to avoid refiltering on unrelated re-renders
  const filteredBookings = useMemo(() => {
    if (!searchTerm) return bookings;
    return bookings.filter((booking) =>
      booking.bookingReference?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, bookings]);

  const currentBookings = useMemo(() => {
    const indexOfLastBooking = currentPage * bookingsPerPage;
    const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage;
    return filteredBookings.slice(indexOfFirstBooking, indexOfLastBooking);
  }, [currentPage, filteredBookings, bookingsPerPage]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page so results always start from the top
  };

  return (
    <div className="bookings-container">
      <h2>All Bookings</h2>

      <div className="search-div">
        <label>Filter by Booking Number:</label>
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Enter booking number"
        />
      </div>

      <div className="booking-results">
        {currentBookings.map((booking) => (
          <div key={booking.id} className="booking-result-item">
            <p><strong>Booking Code:</strong> {booking.bookingReference}</p>
            <p><strong>Check In Date:</strong> {booking.checkInDate}</p>
            <p><strong>Check Out Date:</strong> {booking.checkOutDate}</p>
            <p><strong>Total Price:</strong> {booking.totalPrice}</p>
            <p><strong>Booking Status:</strong> {booking.bookingStatus}</p>
            <button
              className="edit-room-button"
              onClick={() => navigate(`/admin/edit-booking/${booking.bookingReference}`)}
            >
              Manage Booking
            </button>
          </div>
        ))}
      </div>

      <Pagination
        roomPerPage={bookingsPerPage}
        totalRooms={filteredBookings.length}
        currentPage={currentPage}
        paginate={setCurrentPage}
      />
    </div>
  );
};

export default ManageBookingsPage;

