
import {useUser} from "../contexts/AuthContext.tsx"
import {Navigate, Outlet, useLocation} from "react-router-dom"


function RequireLoggedIn() {
    const {user} = useUser()
    const location = useLocation()

    if (user == null) {
        return <Navigate to="/login" state={{ from: location }} />
    }

    return (
        <Outlet/>
    )
}

export default RequireLoggedIn
