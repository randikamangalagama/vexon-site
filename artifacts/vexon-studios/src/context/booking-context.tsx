import { createContext, useContext, useState } from "react";

interface BookingContextType {
  isOpen: boolean;
  openModal: (service?: string) => void;
  closeModal: () => void;
  initialService: string;
}

const BookingContext = createContext<BookingContextType | null>(null);

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialService, setInitialService] = useState("");

  const openModal = (service?: string) => {
    setInitialService(service || "");
    setIsOpen(true);
  };

  const closeModal = () => setIsOpen(false);

  return (
    <BookingContext.Provider value={{ isOpen, openModal, closeModal, initialService }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBookingModal() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBookingModal must be used within BookingProvider");
  return ctx;
}
