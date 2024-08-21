import { Button, TextInput } from "alenite-design"
import { useAppDispatch } from "hooks"
import { useCallback, useMemo } from "react"
import { login } from "features/auth"

const AuthView = () => {

    const dispatch = useAppDispatch();
    const doLogin = useCallback( () => {
        dispatch(login({}));
    },[dispatch]);

    return useMemo( () => <div>
        <span>Login</span>
        <div>
            <TextInput type="text" name="username" label="Username" placeholder="a.username" />
            <TextInput type="password" name="password" label="Password" placeholder="a.password" />
        </div>
        <div>
            <Button type="primary" onClick={doLogin}>Login</Button>
        </div>
    </div>, []);
}

export default AuthView;