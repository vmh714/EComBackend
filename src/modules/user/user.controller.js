import { config } from "dotenv";
import { UserService } from "./user.service.js";

config();

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Lấy danh sách tất cả người dùng
 *     description: >
 *       API này trả về danh sách tất cả người dùng trong hệ thống, có phân trang để tránh quá tải. 
 *       Bạn có thể tưởng tượng nó như một cuốn danh bạ khổng lồ, nhưng thay vì lật từng trang, 
 *       bạn chỉ cần nói với chúng tôi bạn muốn xem trang nào! 
 *       Lưu ý: API này chỉ dành cho quản trị viên, vì lý do riêng tư hiển nhiên rồi!
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Số lượng bản ghi cần bỏ qua (như kiểu bạn muốn bắt đầu từ trang nào đó)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng bản ghi tối đa trả về (đừng tham lam quá nhé!)
 *     responses:
 *       200:
 *         description: Đây là danh sách người dùng bạn yêu cầu!
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pages:
 *                   type: integer
 *                   example: 5
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 total:
 *                   type: integer
 *                   example: 42
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       403:
 *         description: Bạn không có quyền truy cập. Chỉ quản trị viên mới có quyền xem danh sách người dùng.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Access denied. Admin privileges required.
 *       404:
 *         description: Không tìm thấy người dùng nào cả. Có lẽ chúng ta đang ở trong vũ trụ song song?
 *       401:
 *         description: Bạn chưa đăng nhập hoặc token không hợp lệ.
 *       500:
 *         description: Lỗi máy chủ khi truy xuất danh sách người dùng.
 */
/**
 * Lấy danh sách tất cả người dùng với phân trang
 * @param {object} req - Đối tượng request của Express
 * @param {object} req.query - Các tham số truy vấn
 * @param {number} [req.query.start=0] - Số lượng bản ghi cần bỏ qua
 * @param {number} [req.query.limit=10] - Số lượng bản ghi tối đa trả về
 * @param {object} res - Đối tượng response của Express
 * @returns {Promise<object>} Phản hồi JSON với danh sách người dùng hoặc thông báo lỗi
 */
const getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin privileges required." });
    }

    const { start = 0, limit = 10 } = req.query;
    const response = await UserService.getAllUsers(start, limit);
    
    // Vẫn trả về 200 OK ngay cả khi không có người dùng nào
    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * @swagger
 * /user/{id}:
 *   get:
 *     summary: Lấy thông tin người dùng theo ID
 *     description: >
 *       Lấy thông tin chi tiết của một người dùng dựa trên ID. 
 *       Giống như tìm kiếm hồ sơ của một người cụ thể trong một tòa nhà đầy người vậy. 
 *       ID chính là số phòng của họ, và chúng tôi sẽ dẫn bạn đến đúng cánh cửa đó!
 *       Lưu ý: Người dùng chỉ có thể xem thông tin của chính họ, trong khi quản trị viên có thể xem thông tin của bất kỳ người dùng nào.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của người dùng (như một địa chỉ nhà duy nhất vậy!)
 *     responses:
 *       200:
 *         description: Đã tìm thấy người dùng! Đây là thông tin chi tiết.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: ID không hợp lệ. Vui lòng kiểm tra lại ID.
 *       403:
 *         description: Bạn không có quyền xem thông tin này. Bạn chỉ có thể xem thông tin của chính mình.
 *       404:
 *         description: Không tìm thấy người dùng với ID này. Có thể họ đã chuyển nhà?
 *       401:
 *         description: Bạn chưa đăng nhập hoặc token không hợp lệ.
 *       500:
 *         description: Lỗi máy chủ khi truy xuất thông tin người dùng.
 */
/**
 * Lấy thông tin người dùng theo ID
 * @param {object} req - Đối tượng request của Express
 * @param {object} req.params - Các tham số từ URL
 * @param {string} req.params.id - ID người dùng cần tìm
 * @param {object} req.user - Thông tin người dùng hiện tại (từ middleware xác thực)
 * @param {string} req.user.id - ID của người dùng đã xác thực
 * @param {string} req.user.role - Vai trò của người dùng đã xác thực
 * @param {object} res - Đối tượng response của Express
 * @returns {Promise<object>} Phản hồi JSON với dữ liệu người dùng hoặc thông báo lỗi
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const response = await UserService.getUserById(id, user);
    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * @swagger
 * /user:
 *   post:
 *     summary: Tạo người dùng mới không cần đăng ký
 *     description: >
 *       Tạo người dùng mới mà không yêu cầu đăng ký chính thức, thường dùng cho khách mua hàng nhanh. 
 *       Giống như việc cho phép ai đó ghé thăm nhà bạn mà không cần làm thẻ thành viên của khu dân cư. 
 *       Họ vẫn có thể mua sắm, nhưng sẽ không có tất cả các đặc quyền của thành viên chính thức!
 *       Lưu ý: Chỉ quản trị viên mới có quyền tạo người dùng không đăng ký.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - phoneNumber
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên của người dùng (chúng tôi nên gọi bạn là gì?)
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email (không bắt buộc, nhưng hữu ích để liên hệ)
 *               phoneNumber:
 *                 type: string
 *                 description: Số điện thoại (để chúng tôi có thể gọi cho bạn khi đơn hàng đến)
 *               address:
 *                 $ref: '#/components/schemas/Address'
 *                 description: Địa chỉ giao hàng (để chúng tôi biết giao hàng đến đâu)
 *     responses:
 *       201:
 *         description: Đã tạo người dùng mới thành công! Chào mừng đến với cửa hàng của chúng tôi!
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User created successfully
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       403:
 *         description: Bạn không có quyền tạo người dùng. Chỉ quản trị viên mới có thể thực hiện thao tác này.
 *       400:
 *         description: Người dùng này đã tồn tại rồi! Có lẽ bạn đã từng ghé thăm chúng tôi trước đây?
 *       401:
 *         description: Bạn chưa đăng nhập hoặc token không hợp lệ.
 *       500:
 *         description: Ôi không! Máy chủ gặp sự cố khi tạo người dùng mới.
 */
/**
 * Tạo người dùng mới không cần đăng ký
 * @param {object} req - Đối tượng request của Express
 * @param {object} req.body - Dữ liệu từ body của request
 * @param {string} req.body.name - Tên người dùng
 * @param {string} [req.body.email] - Email người dùng (không bắt buộc)
 * @param {string} req.body.phoneNumber - Số điện thoại người dùng
 * @param {object} [req.body.address] - Địa chỉ người dùng (không bắt buộc)
 * @param {object} res - Đối tượng response của Express
 * @returns {Promise<object>} Phản hồi JSON với thông tin người dùng đã tạo hoặc thông báo lỗi
 */
const createNonRegisteredUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin privileges required." });
    }

    const userData = req.body;
    const response = await UserService.createNonRegisteredUser(userData);
    return res.status(201).json(response);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * @swagger
 * /user/{id}:
 *   put:
 *     summary: Cập nhật thông tin người dùng
 *     description: >
 *       Cập nhật thông tin của người dùng hiện có, như tên, email, số điện thoại hoặc địa chỉ. 
 *       Giống như việc sơn lại nhà bạn vậy - cấu trúc vẫn giữ nguyên, nhưng ngoại hình có thể thay đổi hoàn toàn! 
 *       Đừng lo, chúng tôi sẽ không làm mất đồ của bạn trong quá trình này đâu!
 *       Lưu ý: Người dùng chỉ có thể cập nhật thông tin của chính họ, trong khi quản trị viên có thể cập nhật thông tin của bất kỳ người dùng nào.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của người dùng cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Tên mới (nếu bạn muốn đổi tên)
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email mới (nếu bạn muốn đổi email)
 *               phoneNumber:
 *                 type: string
 *                 description: Số điện thoại mới (nếu bạn đổi số)
 *               address:
 *                 type: object
 *                 description: Địa chỉ mới (nếu bạn đã chuyển nhà)
 *                 properties:
 *                   homeNumber:
 *                     type: string
 *                     description: Số nhà mới
 *                   street:
 *                     type: string
 *                     description: Tên đường mới
 *                   district:
 *                     type: string
 *                     description: Quận/huyện mới
 *                   city:
 *                     type: string
 *                     description: Thành phố mới
 *                   state:
 *                     type: string
 *                     description: Bang mới (nếu có)
 *                   province:
 *                     type: string
 *                     description: Tỉnh mới
 *     responses:
 *       200:
 *         description: Thông tin đã được cập nhật thành công! Trông bạn thật tuyệt với diện mạo mới này!
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 1234567890abcdef12345678
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     email:
 *                       type: string
 *                       example: john.doe@example.com
 *                     phoneNumber:
 *                       type: string
 *                       example: 0987654321
 *                     address:
 *                       type: object
 *                       properties:
 *                         homeNumber:
 *                           type: string
 *                           example: 123
 *                         street:
 *                           type: string
 *                           example: Main St
 *                         district:
 *                           type: string
 *                           example: District 1
 *                         city:
 *                           type: string
 *                           example: Ho Chi Minh City
 *                         state:
 *                           type: string
 *                           example: HCM
 *                         province:
 *                           type: string
 *                           example: Vietnam
 *       400:
 *         description: ID không hợp lệ. Vui lòng kiểm tra lại ID.
 *       403:
 *         description: Bạn không có quyền cập nhật thông tin này. Bạn chỉ có thể cập nhật thông tin của chính mình.
 *       404:
 *         description: Không tìm thấy người dùng này. Có thể họ đã biến mất khỏi hệ thống?
 *       401:
 *         description: Bạn chưa đăng nhập hoặc token không hợp lệ.
 *       500:
 *         description: Có lỗi xảy ra khi cập nhật thông tin. Có vẻ như máy chủ hơi mệt mỏi!
 */
/**
 * Cập nhật thông tin người dùng hiện có
 * @param {object} req - Đối tượng request của Express
 * @param {object} req.params - Các tham số từ URL
 * @param {string} req.params.id - ID người dùng cần cập nhật
 * @param {object} req.body - Dữ liệu cần cập nhật
 * @param {string} [req.body.name] - Tên mới
 * @param {string} [req.body.email] - Email mới
 * @param {string} [req.body.phoneNumber] - Số điện thoại mới
 * @param {object} [req.body.address] - Địa chỉ mới
 * @param {object} res - Đối tượng response của Express
 * @returns {Promise<object>} Phản hồi JSON với thông tin người dùng đã cập nhật hoặc thông báo lỗi
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const updateData = req.body;
    const response = await UserService.updateUser(id, user, updateData);
    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * @swagger
 * /user/{id}:
 *   delete:
 *     summary: Xóa người dùng
 *     description: >
 *       Xóa hoàn toàn một người dùng khỏi hệ thống. Hành động này không thể hoàn tác! 
 *       Giống như khi bạn xóa số điện thoại của người yêu cũ vậy - một khi đã xóa, 
 *       bạn sẽ phải bắt đầu lại từ đầu nếu muốn kết nối lại. 
 *       Hãy cẩn thận với quyền lực này, nó rất mạnh mẽ!
 *       Lưu ý: Người dùng chỉ có thể xóa tài khoản của chính họ, trong khi quản trị viên có thể xóa bất kỳ tài khoản nào.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID của người dùng sắp bị "thanh trừng" khỏi hệ thống
 *     responses:
 *       204:
 *         description: Người dùng đã được xóa thành công. Họ sẽ được nhớ mãi trong tim chúng tôi!
 *       403:
 *         description: Bạn không có quyền xóa người dùng này. Bạn chỉ có thể xóa tài khoản của chính mình.
 *       404:
 *         description: Không tìm thấy người dùng này để xóa. Có lẽ họ đã tự biến mất trước đó?
 *       401:
 *         description: Bạn chưa đăng nhập hoặc token không hợp lệ.
 *       500:
 *         description: Máy chủ gặp sự cố khi thực hiện lệnh xóa. Có vẻ như nó đang cố bảo vệ người dùng này!
 */
/**
 * Xóa người dùng theo ID
 * @param {object} req - Đối tượng request của Express
 * @param {object} req.params - Các tham số từ URL
 * @param {string} req.params.id - ID của người dùng cần xóa
 * @param {object} res - Đối tượng response của Express
 * @returns {Promise<object>} Phản hồi rỗng khi xóa thành công hoặc thông báo lỗi
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    await UserService.deleteUser(id, user);
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

const UserControllers = {
  getAllUsers,
  getUserById,
  createNonRegisteredUser,
  updateUser,
  deleteUser,
};

export default UserControllers;