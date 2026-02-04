export const Routes = {
  Auth: {
    Login: 'Auth/Login',
    Register: 'Auth/Register',
  },
  App: {
    Events: 'App/Events',
    Chat: 'App/Chat',
    Profile: 'App/Profile',
    Bookings: 'App/Bookings',
    Challenges: 'App/Challenges',
  },
  Events: {
    List: 'Events/List',
    Details: 'Events/Details',
    Create: 'Events/Create',
    Edit: 'Events/Edit',
    ScanTickets: 'Events/ScanTickets',
  },
  Chat: {
    List: 'Chat/List',
    Detail: 'Chat/Detail',
  },
  Bookings: {
    Upcoming: 'Bookings/Upcoming',
    Past: 'Bookings/Past',
  },
} as const;
