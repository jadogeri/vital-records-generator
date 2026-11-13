import React from 'react';

const CopyrightNotice = () => {
  const currentYear = new Date().getFullYear();
  const copyrightHolder = "Orleans Parish Assessor's Office"; // Replace with your company or individual name

  return (
    <p style={{ textAlign: 'center', padding: '0px', fontSize: '0.9em' }}>
      &copy; {currentYear} {copyrightHolder}. All rights reserved.
    </p>
  );
};

export default CopyrightNotice;