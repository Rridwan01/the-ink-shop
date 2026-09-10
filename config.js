/**
 * Studio & Notification Configuration
 * Edit these settings to customize your tattoo booking experience.
 */
const STUDIO_CONFIG = {
  studioName: "Jillian's Tattoo Studio",
  artistName: "Jillian",
  artistHandle: "@jillianstattoo",
  location: "Private Studio • By Appointment Only",
  depositAmount: "$200",
  currency: "USD",
  responseWindow: "24-48 hours",
  
  // Notification Webhooks (Discord, Telegram, or custom webhook)
  // You can set your Discord Webhook URL here or via the in-app Settings modal
  notifications: {
    enabled: true,
    // Paste your Discord Webhook URL here (e.g. "https://discord.com/api/webhooks/...")
    discordWebhookUrl: "",
    
    // Optional Formspree / Email endpoint for email notifications
    emailEndpoint: "",
    
    // Ping owner as soon as someone opens the booking link
    notifyOnPageView: true,
    
    // Ping owner when visitor clicks "Begin Booking Request"
    notifyOnStartBooking: true,
    
    // Ping owner when form is completed and submitted
    notifyOnSubmission: true
  },

  // Available Time Slots & Days for Booking
  availableDays: ["Monday", "Tuesday", "Thursday", "Friday", "Saturday"],
  availableTimeSlots: [
    { id: "slot_1130", label: "11:30 AM", period: "Morning Session" },
    { id: "slot_1430", label: "2:30 PM", period: "Afternoon Session" },
    { id: "slot_1630", label: "4:30 PM", period: "Late Afternoon Session" }
  ],

  // Deposit Payment Methods Accepted
  paymentMethods: [
    { id: "zelle", name: "Zelle", icon: "⚡" },
    { id: "applepay", name: "Apple Pay", icon: "" },
    { id: "venmo", name: "Venmo", icon: "💸" },
    { id: "paypal", name: "PayPal", icon: "🅿️" },
    { id: "cashapp", name: "Cash App", icon: "💲" },
    { id: "etransfer", name: "E-Transfer", icon: "🏦" }
  ]
};

// Expose on window
window.STUDIO_CONFIG = STUDIO_CONFIG;
