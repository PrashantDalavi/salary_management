import React, { useState } from 'react'

export default function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="container mt-5">
      <div className="row">
        <div className="col-md-12">
          <h1>Salary Management System</h1>
          <p className="lead">Welcome to your React-powered application!</p>

          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Counter Example</h5>
              <p className="card-text">This is a simple React component running on Rails.</p>
              <p>Count: <strong>{count}</strong></p>
              <button
                className="btn btn-primary me-2"
                onClick={() => setCount(count + 1)}
              >
                Increment
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setCount(0)}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
