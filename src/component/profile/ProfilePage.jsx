import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../service/ApiService';

const ProfilePage = () => {
    const [user, setUser] = useState(null);
    const [bookings, setBookings] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const myProfileResponse = await ApiService.myProfile();
                setUser(myProfileResponse.user)
                const myBookingResponse = await ApiService.myBookings();
                setBookings(myBookingResponse.bookings)

            } catch (error) {
                setError(error.response?.data?.message || error.message);
            }
        };

        fetchUserProfile();
    }, []);

    const handleLogout = () => {
        ApiService.logout();
        navigate('/home');
    };

    const handleEditProfile = () => {
        navigate('/edit-profile');
    };

    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) return;
        try {
            await ApiService.cancelBooking(bookingId);
            const myBookingResponse = await ApiService.myBookings();
            setBookings(myBookingResponse.bookings);
        } catch (err) {
            setError(err.response?.data?.message || err.message);
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    return (
        <div className="profile-page">
            {user && <h2>Welcome, {user.firstName}</h2>}
            <div className="profile-actions">
                <button className="edit-profile-button" onClick={handleEditProfile}>Edit Profile</button>
                <button className="logout-button" onClick={handleLogout}>Logout</button>
            </div>
            {error && <p className="error-message">{error}</p>}
            {user && (
                <div className="profile-details">
                    <h3>My Profile Details</h3>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Phone Number:</strong> {user.phoneNumber}</p>
                </div>
            )}
            <div className="bookings-section">
                <h3>My Booking History</h3>
                <div className="booking-list">
                    {bookings && bookings.length > 0 ? (
                        bookings.map((booking) => (
                            <div key={booking.id} className="booking-item">
                                <p><strong>Booking Code:</strong> {booking.bookingReference}</p>
                                <p><strong>Check-in Date:</strong> {booking.checkInDate}</p>
                                <p><strong>Check-out Date:</strong> {booking.checkOutDate}</p>
                                <p><strong>Booking Status:</strong> {booking.bookingStatus}</p>
                                <p><strong>Amount:</strong> {booking.totalPrice}</p>
                                <p><strong>Room Number:</strong> {booking.room?.roomNumber ?? 'N/A'}</p>
                                <p><strong>Room Type:</strong> {booking.room?.type ?? 'N/A'}</p>
                                {booking.room?.imageUrl && <img src={booking.room.imageUrl} alt="Room" className="room-photo" />}
                                {/* Cancellation is only allowed strictly before the check-in date.
                                    Compare date strings (YYYY-MM-DD) in local time to avoid UTC/JST
                                    midnight shift that would hide the button after 09:00 JST. */}
                                {booking.bookingStatus === 'BOOKED' &&
                                    booking.checkInDate > new Date().toLocaleDateString('sv') && (
                                    <button
                                        className="cancel-booking-button"
                                        onClick={() => handleCancelBooking(booking.id)}
                                    >
                                        Cancel Booking
                                    </button>
                                )}
                            </div>
                        ))
                    ) : (
                        <p>No bookings found.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
