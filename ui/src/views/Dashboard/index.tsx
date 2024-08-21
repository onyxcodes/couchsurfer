import { Button } from "alenite-design";
import { useAppDispatch } from "hooks";
import { useCallback } from "react";
import { logout } from "features/auth";

const Dashboard = () => {
    const dispatch = useAppDispatch()

    const doLogout = useCallback( () => {
        dispatch(logout(true));
    }, [dispatch])
    return (
        <div>
        <h1>Dashboard</h1>
        <Button type="primary" onClick={doLogout}>Logout</Button>
        </div>
    );
}

export default Dashboard
