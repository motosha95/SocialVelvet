export const Routes = {
  Auth: {
    Login: 'Auth/Login',
    Register: 'Auth/Register',
  },
  App: {
    Events: 'App/Events',
    Chat: 'App/Chat',
    Profile: 'App/Profile',
  },
  Events: {
    List: 'Events/List',
    Details: 'Events/Details',
    Create: 'Events/Create',
    Edit: 'Events/Edit',
  },
  Chat: {
    List: 'Chat/List',
    Detail: 'Chat/Detail',
  },
} as const;
