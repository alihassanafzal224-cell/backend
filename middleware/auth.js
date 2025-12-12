
import jwt from 'jsonwebtoken';

const auth = (req, res, next) => {
	try {
		

        const token = req.cookies?.token;
        
		if (!token) return res.status(401).json({ message: 'Authentication token missing' });

		const secret = process.env.JWT_SECRET;
		if (!secret) return res.status(500).json({ message: 'JWT secret not configured' });

		const decoded = jwt.verify(token, secret);
		req.user = decoded; 
		next();
	} catch (error) {
		return res.status(401).json({ message: 'Invalid or expired token', error: error.message });
	}
};

export default auth;
