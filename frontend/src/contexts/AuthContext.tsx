//
//
//  AuthContext
//
//

import {createContext, ReactNode, useContext, useState} from "react"
import {User} from "../interfaces.ts";

interface AuthContext {
    user: User | null
    setUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContext>({
    user: null,
    setUser: () => {}
})

export const AuthProvider = function({user, children}: {user: User | null, children: ReactNode}) {
    const [currentUser, setCurrentUser] = useState(user)

    return (
        <AuthContext.Provider value={{ user: currentUser, setUser: setCurrentUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useUser() {
    return useContext(AuthContext)
}
