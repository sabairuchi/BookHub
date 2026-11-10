
export default function handler(req, res) {
  return res.status(404).json({
    success: false,
    status: 404,
    error: "Not Found",
    message: "The requested API endpoint could not be found."
  });
}
