// FormRowVertical.jsx
import styled from "styled-components";

const StyledFormRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding: 1.2rem 0;

  & label {
    font-weight: 500;
  }

  & input,
  & textarea,
  & select {
    width: 100%;
    padding: 0.8rem 1.2rem;
    border: 1px solid var(--color-grey-300);
    border-radius: var(--border-radius-sm);
    background-color: var(--color-grey-0);
  }

  & p {
    color: var(--color-red-700);
    font-size: 1.4rem;
  }
`;

function FormRowVertical({ label, error, children }) {
  return (
    <StyledFormRow>
      {label && <label>{label}</label>}
      {children}
      {error && <p>{error}</p>}
    </StyledFormRow>
  );
}

export default FormRowVertical;
