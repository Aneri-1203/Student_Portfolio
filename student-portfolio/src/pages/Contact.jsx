import { useState } from 'react';

function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [showTip, setShowTip] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const subject = `Portfolio message from ${formData.name || 'a visitor'}`;
    const body = `${formData.message}\n\nReply to: ${formData.email}`;
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=Aneri123@gmail.com&su=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <section id="contact" className="contact">
      <p className="section-label">Contact</p>

      <form className="contact-form" onSubmit={handleSubmit}>
        <label htmlFor="name">
          Name
          <input
            id="name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </label>

        <label htmlFor="email">
          Email
          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </label>

        <div className="message-row">
          <label htmlFor="message">Message</label>
          <button
            type="button"
            className="tip-toggle"
            onClick={() => setShowTip((prev) => !prev)}
          >
            ?
          </button>
        </div>
        {showTip && (
          <p className="tip">Tip: mention what you'd like to collaborate on or ask about.</p>
        )}
        <textarea
          id="message"
          name="message"
          rows={5}
          value={formData.message}
          onChange={handleChange}
          required
        />
        <p className="char-count">{formData.message.length} characters</p>

        <button type="submit" className="submit-btn">
          Send Message
        </button>
      </form>
    </section>
  );
}

export default Contact;