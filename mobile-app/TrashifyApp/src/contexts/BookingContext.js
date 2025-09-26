import React, { createContext, useContext, useReducer } from 'react';
import bookingService from '../services/bookingService';

const BookingContext = createContext();

const bookingReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_BOOKINGS':
      return { ...state, bookings: action.payload, loading: false };
    case 'ADD_BOOKING':
      return { ...state, bookings: [action.payload, ...state.bookings] };
    case 'UPDATE_BOOKING':
      return {
        ...state,
        bookings: state.bookings.map(booking =>
          booking.id === action.payload.id ? action.payload : booking
        ),
      };
    case 'REMOVE_BOOKING':
      return {
        ...state,
        bookings: state.bookings.filter(booking => booking.id !== action.payload),
      };
    case 'SET_CURRENT_BOOKING':
      return { ...state, currentBooking: action.payload };
    case 'CLEAR_CURRENT_BOOKING':
      return { ...state, currentBooking: null };
    default:
      return state;
  }
};

const initialState = {
  bookings: [],
  currentBooking: null,
  loading: false,
  error: null,
};

export const BookingProvider = ({ children }) => {
  const [state, dispatch] = useReducer(bookingReducer, initialState);

  const setLoading = (loading) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setError = (error) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const getMyBookings = async (status = null, limit = 20, offset = 0) => {
    try {
      setLoading(true);
      clearError();
      
      const response = await bookingService.getMyBookings(status, limit, offset);
      dispatch({ type: 'SET_BOOKINGS', payload: response.bookings });
      
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const createBooking = async (bookingData) => {
    try {
      setLoading(true);
      clearError();
      
      const response = await bookingService.createBooking(bookingData);
      dispatch({ type: 'ADD_BOOKING', payload: response.booking });
      
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const getBookingById = async (bookingId) => {
    try {
      setLoading(true);
      clearError();
      
      const response = await bookingService.getBookingById(bookingId);
      dispatch({ type: 'SET_CURRENT_BOOKING', payload: response.booking });
      
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const updateBooking = async (bookingId, updateData) => {
    try {
      setLoading(true);
      clearError();
      
      const response = await bookingService.updateBooking(bookingId, updateData);
      dispatch({ type: 'UPDATE_BOOKING', payload: response.booking });
      
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const cancelBooking = async (bookingId) => {
    try {
      setLoading(true);
      clearError();
      
      const response = await bookingService.cancelBooking(bookingId);
      dispatch({ type: 'REMOVE_BOOKING', payload: bookingId });
      
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const updateBookingStatus = async (bookingId, status, notes = null) => {
    try {
      setLoading(true);
      clearError();
      
      const response = await bookingService.updateBookingStatus(bookingId, status, notes);
      
      // Update the booking in the list
      const updatedBooking = await bookingService.getBookingById(bookingId);
      dispatch({ type: 'UPDATE_BOOKING', payload: updatedBooking.booking });
      
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const addMaterial = async (bookingId, materialId, quantity) => {
    try {
      setLoading(true);
      clearError();
      
      const response = await bookingService.addMaterial(bookingId, materialId, quantity);
      
      // Refresh the booking
      const updatedBooking = await bookingService.getBookingById(bookingId);
      dispatch({ type: 'UPDATE_BOOKING', payload: updatedBooking.booking });
      
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const removeMaterial = async (bookingId, materialId) => {
    try {
      setLoading(true);
      clearError();
      
      const response = await bookingService.removeMaterial(bookingId, materialId);
      
      // Refresh the booking
      const updatedBooking = await bookingService.getBookingById(bookingId);
      dispatch({ type: 'UPDATE_BOOKING', payload: updatedBooking.booking });
      
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const getBookingMaterials = async (bookingId) => {
    try {
      setLoading(true);
      clearError();
      
      const response = await bookingService.getBookingMaterials(bookingId);
      
      return response;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const clearCurrentBooking = () => {
    dispatch({ type: 'CLEAR_CURRENT_BOOKING' });
  };

  const refreshBookings = async (status = null) => {
    try {
      await getMyBookings(status);
    } catch (error) {
      console.error('Refresh bookings error:', error);
    }
  };

  const value = {
    ...state,
    getMyBookings,
    createBooking,
    getBookingById,
    updateBooking,
    cancelBooking,
    updateBookingStatus,
    addMaterial,
    removeMaterial,
    getBookingMaterials,
    clearCurrentBooking,
    refreshBookings,
    setLoading,
    setError,
    clearError,
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};
