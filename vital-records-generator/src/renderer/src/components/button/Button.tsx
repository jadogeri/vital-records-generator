    // src/components/Button/Button.tsx
    import React from 'react';
    import './Button.css'; // Assuming you have a CSS file for styling

    export interface ButtonProps {
      label: string; // The text displayed on the button
      onClick?: () => void; // Function to be called when the button is clicked
      disabled?: boolean; // Optional prop to disable the button
      className?: string; // Optional prop for custom CSS classes
    }

    const Button: React.FC<ButtonProps> = ({ label, onClick, disabled = false, className }) => {
      const buttonClasses = `button-base ${className || ''}`; // Combine base and custom classes

      return (
        <button onClick={onClick} disabled={disabled} className={buttonClasses}
                style={{height:15, paddingBottom:20, fontSize:12, justifyContent:"center"
                }}
        >
          {label}
        </button>
      );
    };

    export default Button;