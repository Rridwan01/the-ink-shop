/**
 * Studio & Notification Configuration
 * Edit these settings to customize your tattoo booking experience.
 */
const STUDIO_CONFIG = {
  studioName: "Sanctum Tattoo Atelier",
  artistName: "Sanctum",
  artistHandle: "@sanctum.tattoo",
  location: "Private Studio • By Appointment Only",
  depositAmount: "$200",
  currency: "USD",
  responseWindow: "24-48 hours",
  
  // Notification Webhooks (Discord, Telegram, or custom webhook)
  notifications: {
    enabled: true,
    discordWebhookUrl: "",
    emailEndpoint: "",
    notifyOnPageView: true,
    notifyOnStartBooking: true,
    notifyOnSubmission: true
  },

  // Available Time Slots & Days for Booking
  availableDays: ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"],
  availableTimeSlots: [
    { id: "slot_1130", label: "11:30 AM", period: "Morning Session" },
    { id: "slot_1430", label: "2:30 PM", period: "Afternoon Session" },
    { id: "slot_1630", label: "4:30 PM", period: "Late Afternoon Session" }
  ]
};

// Expose on window
window.STUDIO_CONFIG = STUDIO_CONFIG;
