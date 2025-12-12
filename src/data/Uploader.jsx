import { useState } from "react";
import { isFuture, isPast, isToday } from "date-fns";
import supabase from "../services/supabase";
import Button from "../ui/Button";
import { subtractDates } from "../utils/helpers";
import toast from "react-hot-toast";

import { bookings } from "./data-bookings";
import { cabins } from "./data-cabins";
import { guests } from "./data-guests";

async function deleteGuests() {
  const { error } = await supabase.from("guests").delete().gt("id", 0);
  if (error) console.log(error.message);
}

async function deleteCabins() {
  const { error } = await supabase.from("cabins").delete().gt("id", 0);
  if (error) console.log(error.message);
}

async function deleteBookings() {
  const { error } = await supabase.from("bookings").delete().gt("id", 0);
  if (error) console.log(error.message);
}

async function createGuests() {
  // محاولة إدراج البيانات مع nationalID أولاً
  let { error } = await supabase.from("guests").insert(guests);
  
  // إذا فشل بسبب nationalID، حاول بدون nationalID
  if (error && (error.message?.includes("nationalID") || error.message?.includes("national_id"))) {
    const guestsWithoutNationalID = guests.map(({ nationalID, ...rest }) => rest);
    ({ error } = await supabase.from("guests").insert(guestsWithoutNationalID));
  }
  
  if (error) {
    console.error("Error creating guests:", error);
  }
}

async function createCabins() {
  const { error } = await supabase.from("cabins").insert(cabins);
  if (error) console.log(error.message);
}

async function createBookings() {
  // Bookings need a guestId and a cabinId. We can't tell Supabase IDs for each object, it will calculate them on its own. So it might be different for different people, especially after multiple uploads. Therefore, we need to first get all guestIds and cabinIds, and then replace the original IDs in the booking data with the actual ones from the DB
  const { data: guestsIds, error: guestsError } = await supabase
    .from("guests")
    .select("id")
    .order("id");
  
  if (guestsError) {
    console.error("Error fetching guests:", guestsError);
    throw new Error("Failed to fetch guests: " + guestsError.message);
  }
  
  if (!guestsIds || guestsIds.length === 0) {
    throw new Error("No guests found in database! Please create guests first.");
  }
  
  const allGuestIds = guestsIds.map((guest) => guest.id);
  
  const { data: cabinsIds, error: cabinsError } = await supabase
    .from("cabins")
    .select("id")
    .order("id");
  
  if (cabinsError) {
    console.error("Error fetching cabins:", cabinsError);
    throw new Error("Failed to fetch cabins: " + cabinsError.message);
  }
  
  if (!cabinsIds || cabinsIds.length === 0) {
    throw new Error("No cabins found in database! Please create cabins first.");
  }
  
  const allCabinIds = cabinsIds.map((cabin) => cabin.id);

  const finalBookings = bookings.map((booking) => {
    // Here relying on the order of cabins, as they don't have and ID yet
    const cabin = cabins.at(booking.cabinId - 1);
    const numNights = subtractDates(booking.endDate, booking.startDate);
    const cabinPrice = numNights * (cabin.regularPrice - cabin.discount);
    const extrasPrice = booking.hasBreakfast
      ? numNights * 15 * booking.numGuests
      : 0; // hardcoded breakfast price
    const totalPrice = cabinPrice + extrasPrice;

    let status;
    if (
      isPast(new Date(booking.endDate)) &&
      !isToday(new Date(booking.endDate))
    )
      status = "checked-out";
    if (
      isFuture(new Date(booking.startDate)) ||
      isToday(new Date(booking.startDate))
    )
      status = "unconfirmed";
    if (
      (isFuture(new Date(booking.endDate)) ||
        isToday(new Date(booking.endDate))) &&
      isPast(new Date(booking.startDate)) &&
      !isToday(new Date(booking.startDate))
    )
      status = "checked-in";

    // حساب guestId و cabinId بشكل آمن
    const guestIndex = booking.guestId - 1;
    const cabinIndex = booking.cabinId - 1;
    const actualGuestId = allGuestIds[guestIndex];
    const actualCabinId = allCabinIds[cabinIndex];

    if (!actualGuestId || !actualCabinId) {
      console.warn(`Warning: Missing guestId or cabinId for booking`, booking);
    }

    return {
      ...booking,
      numNights,
      cabinPrice,
      extrasPrice,
      totalPrice,
      guestId: actualGuestId,
      cabinId: actualCabinId,
      status,
    };
  });

  // التحقق من الـ bookings قبل الإدراج
  const bookingsWithNullGuestId = finalBookings.filter(b => !b.guestId);
  if (bookingsWithNullGuestId.length > 0) {
    throw new Error(`${bookingsWithNullGuestId.length} bookings have null guestId!`);
  }

  const { data, error } = await supabase.from("bookings").insert(finalBookings);
  if (error) {
    console.error("Error inserting bookings:", error);
    throw new Error("Failed to insert bookings: " + error.message);
  }
  
  return data;
}

function Uploader() {
  const [isLoading, setIsLoading] = useState(false);

  async function uploadAll() {
    setIsLoading(true);
    try {
      // Bookings need to be deleted FIRST
      await deleteBookings();
      await deleteGuests();
      await deleteCabins();

      // Bookings need to be created LAST
      await createGuests();
      await createCabins();
      await createBookings();
      toast.success("All data uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload data");
    } finally {
      setIsLoading(false);
    }
  }

  async function uploadBookings() {
    setIsLoading(true);
    try {
      await deleteBookings();
      const result = await createBookings();
      if (result) {
        toast.success(`Successfully uploaded ${result.length || bookings.length} bookings!`);
      } else {
        toast.success("Bookings uploaded successfully!");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload bookings");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      style={{
        marginTop: "auto",
        backgroundColor: "#e0e7ff",
        padding: "8px",
        borderRadius: "5px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <h3>SAMPLE DATA</h3>

      <Button onClick={uploadAll} disabled={isLoading}>
        Upload ALL
      </Button>

      <Button onClick={uploadBookings} disabled={isLoading}>
        Upload bookings ONLY
      </Button>
    </div>
  );
}

export default Uploader;
