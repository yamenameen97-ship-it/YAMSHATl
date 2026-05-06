import PasswordRecoveryFlow from '../components/auth/PasswordRecoveryFlow.jsx';

export default function ResetPassword() {
  return <PasswordRecoveryFlow initialStep="verify" />;
}
