import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Event, EventContextType } from "../types";
import { apiClient } from "../utils/api";

const EventContext = createContext<EventContextType | undefined>(undefined);

export const useEvents = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error("useEvents must be used within an EventProvider");
  }
  return context;
};

interface EventProviderProps {
  children: ReactNode;
}

export const EventProvider: React.FC<EventProviderProps> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [sortBy, setSortBy] = useState("date");

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [events, searchQuery, selectedCategory, selectedDate, sortBy]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get("/events");
      setEvents(response.events);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...events];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          event.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(
        (event) => event.category === selectedCategory
      );
    }

    // Date filter
    if (selectedDate) {
      filtered = filtered.filter((event) => {
        const eventDate = new Date(event.date).toDateString();
        const filterDate = new Date(selectedDate).toDateString();
        return eventDate === filterDate;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "title":
          return a.title.localeCompare(b.title);
        case "price":
          return a.price - b.price;
        case "availability":
          return b.availableSeats - a.availableSeats;
        default:
          return 0;
      }
    });

    setFilteredEvents(filtered);
  };

  const searchEvents = (query: string) => {
    setSearchQuery(query);
  };

  const filterByCategory = (category: string) => {
    setSelectedCategory(category);
  };

  const filterByDate = (date: string) => {
    setSelectedDate(date);
  };

  const sortEvents = (sort: string) => {
    setSortBy(sort);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedDate("");
    setSortBy("date");
  };

  const value: EventContextType = {
    events,
    loading,
    error,
    filteredEvents,
    searchQuery,
    selectedCategory,
    selectedDate,
    sortBy,
    fetchEvents,
    searchEvents,
    filterByCategory,
    filterByDate,
    sortEvents,
    clearFilters,
  };

  return (
    <EventContext.Provider value={value}>{children}</EventContext.Provider>
  );
};
