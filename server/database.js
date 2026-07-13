import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Helper to map MongoDB _id to virtual id key for frontend/controller compatibility
const mapDoc = (doc) => {
  if (!doc) return doc;
  if (Array.isArray(doc)) {
    return doc.map(mapDoc);
  }
  const newDoc = { ...doc };
  if (newDoc._id) {
    newDoc.id = newDoc._id.toString();
  }
  return newDoc;
};

// MongoDB schemas
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'employee'], default: 'employee' },
  department: { type: String, default: 'General' },
  designation: { type: String, default: 'Associate' },
  joinDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
  leavesRemaining: {
    casual: { type: Number, default: 10 },
    sick: { type: Number, default: 8 },
    annual: { type: Number, default: 15 }
  },
  status: { type: String, default: 'active' }
});

const AttendanceSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  date: { type: String, required: true },
  clockIn: { type: String, required: true },
  clockOut: { type: String, default: '' },
  location: { type: String },
  status: { type: String, enum: ['Present', 'Late', 'Absent', 'Half-Day'], default: 'Present' }
});

const LeaveRequestSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  employeeName: { type: String, required: true },
  leaveType: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  managerComment: { type: String, default: '' },
  appliedDate: { type: String, default: () => new Date().toISOString().split('T')[0] }
});

const DepartmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  manager: { type: String },
  description: { type: String }
});

const HolidaySchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: String, required: true },
  description: { type: String }
});

const EmailSchema = new mongoose.Schema({
  recipient: { type: String, required: true },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  sentAt: { type: Date, default: Date.now }
});

// Setup Mongo models
const MongoUser = mongoose.models.User || mongoose.model('User', UserSchema);
const MongoAttendance = mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);
const MongoLeave = mongoose.models.LeaveRequest || mongoose.model('LeaveRequest', LeaveRequestSchema);
const MongoDept = mongoose.models.Department || mongoose.model('Department', DepartmentSchema);
const MongoHoliday = mongoose.models.Holiday || mongoose.model('Holiday', HolidaySchema);
const MongoEmail = mongoose.models.Email || mongoose.model('Email', EmailSchema);

// Seeding default configuration and demo login users to MongoDB if empty
const seedMongoInitialData = async () => {
  try {
    // 1. Seed departments if empty
    const deptCount = await MongoDept.countDocuments();
    if (deptCount === 0) {
      console.log('🌱 Seeding default departments to MongoDB...');
      await MongoDept.insertMany([
        { name: 'Engineering', code: 'ENG', manager: 'Jane Doe', description: 'Software engineering and product development' },
        { name: 'Human Resources', code: 'HR', manager: 'Alice Jones', description: 'Talent acquisition, employee welfare, and operations' },
        { name: 'Sales & Marketing', code: 'MKT', manager: 'Bob Miller', description: 'Customer relations and product marketing' }
      ]);
    }

    // 2. Seed holidays if empty
    const holidayCount = await MongoHoliday.countDocuments();
    if (holidayCount === 0) {
      console.log('🌱 Seeding default holidays to MongoDB...');
      await MongoHoliday.insertMany([
        { name: "New Year's Day", date: '2026-01-01', description: 'National Holiday' },
        { name: 'Good Friday', date: '2026-04-03', description: 'Public Holiday' },
        { name: 'Independence Day', date: '2026-07-04', description: 'National Holiday' },
        { name: 'Labor Day', date: '2026-09-07', description: 'Public Holiday' },
        { name: 'Thanksgiving Day', date: '2026-11-26', description: 'National Holiday' },
        { name: 'Christmas Day', date: '2026-12-25', description: 'National Holiday' }
      ]);
    }

    // 3. Seed default users (admin and employee) if empty
    const userCount = await MongoUser.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Seeding default credentials to MongoDB...');
      const salt = await bcrypt.genSalt(10);
      const hashedPasswordAdmin = await bcrypt.hash('admin123', salt);
      const hashedPasswordEmp = await bcrypt.hash('employee123', salt);

      await MongoUser.insertMany([
        {
          name: 'System Administrator',
          email: 'admin@company.com',
          password: hashedPasswordAdmin,
          role: 'admin',
          department: 'Management',
          designation: 'IT Director',
          joinDate: '2022-01-15',
          leavesRemaining: { casual: 10, sick: 8, annual: 15 },
          status: 'active'
        },
        {
          name: 'Jane Doe',
          email: 'employee@company.com',
          password: hashedPasswordEmp,
          role: 'employee',
          department: 'Engineering',
          designation: 'Senior Software Engineer',
          joinDate: '2023-04-10',
          leavesRemaining: { casual: 7, sick: 5, annual: 12 },
          status: 'active'
        }
      ]);
    }
  } catch (seedErr) {
    console.error('⚠️ Failed to seed initial database collections:', seedErr.message);
  }
};

// Database connection initialization
export const connectDatabase = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in the environment variables.');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('🔌 Connected to MongoDB successfully.');
    
    // Seed database if empty
    await seedMongoInitialData();
    return true;
  } catch (err) {
    console.error('❌ MongoDB connection failed. Error:', err.message);
    process.exit(1);
  }
};

// Unified database interface object
export const db = {
  users: {
    find: async (filter) => mapDoc(await MongoUser.find(filter).lean()),
    findOne: async (filter) => mapDoc(await MongoUser.findOne(filter).lean()),
    findById: async (id) => mapDoc(await MongoUser.findById(id).lean()),
    create: async (data) => {
      const item = await MongoUser.create(data);
      return mapDoc(item.toObject());
    },
    findByIdAndUpdate: async (id, data) => mapDoc(await MongoUser.findByIdAndUpdate(id, data, { new: true }).lean()),
    findByIdAndDelete: async (id) => mapDoc(await MongoUser.findByIdAndDelete(id).lean()),
    countDocuments: async (filter) => MongoUser.countDocuments(filter)
  },
  attendance: {
    find: async (filter) => mapDoc(await MongoAttendance.find(filter).lean()),
    findOne: async (filter) => mapDoc(await MongoAttendance.findOne(filter).lean()),
    findById: async (id) => mapDoc(await MongoAttendance.findById(id).lean()),
    create: async (data) => {
      const item = await MongoAttendance.create(data);
      return mapDoc(item.toObject());
    },
    findByIdAndUpdate: async (id, data) => mapDoc(await MongoAttendance.findByIdAndUpdate(id, data, { new: true }).lean()),
    findByIdAndDelete: async (id) => mapDoc(await MongoAttendance.findByIdAndDelete(id).lean()),
    countDocuments: async (filter) => MongoAttendance.countDocuments(filter)
  },
  leaves: {
    find: async (filter) => mapDoc(await MongoLeave.find(filter).lean()),
    findOne: async (filter) => mapDoc(await MongoLeave.findOne(filter).lean()),
    findById: async (id) => mapDoc(await MongoLeave.findById(id).lean()),
    create: async (data) => {
      const item = await MongoLeave.create(data);
      return mapDoc(item.toObject());
    },
    findByIdAndUpdate: async (id, data) => mapDoc(await MongoLeave.findByIdAndUpdate(id, data, { new: true }).lean()),
    findByIdAndDelete: async (id) => mapDoc(await MongoLeave.findByIdAndDelete(id).lean()),
    countDocuments: async (filter) => MongoLeave.countDocuments(filter)
  },
  departments: {
    find: async (filter) => mapDoc(await MongoDept.find(filter).lean()),
    findOne: async (filter) => mapDoc(await MongoDept.findOne(filter).lean()),
    findById: async (id) => mapDoc(await MongoDept.findById(id).lean()),
    create: async (data) => {
      const item = await MongoDept.create(data);
      return mapDoc(item.toObject());
    },
    findByIdAndUpdate: async (id, data) => mapDoc(await MongoDept.findByIdAndUpdate(id, data, { new: true }).lean()),
    findByIdAndDelete: async (id) => mapDoc(await MongoDept.findByIdAndDelete(id).lean()),
    countDocuments: async (filter) => MongoDept.countDocuments(filter)
  },
  holidays: {
    find: async (filter) => mapDoc(await MongoHoliday.find(filter).lean()),
    findOne: async (filter) => mapDoc(await MongoHoliday.findOne(filter).lean()),
    findById: async (id) => mapDoc(await MongoHoliday.findById(id).lean()),
    create: async (data) => {
      const item = await MongoHoliday.create(data);
      return mapDoc(item.toObject());
    },
    findByIdAndUpdate: async (id, data) => mapDoc(await MongoHoliday.findByIdAndUpdate(id, data, { new: true }).lean()),
    findByIdAndDelete: async (id) => mapDoc(await MongoHoliday.findByIdAndDelete(id).lean()),
    countDocuments: async (filter) => MongoHoliday.countDocuments(filter)
  },
  emails: {
    find: async (filter) => mapDoc(await MongoEmail.find(filter).sort({ sentAt: -1 }).lean()),
    create: async (data) => {
      const emailObj = { ...data, sentAt: new Date() };
      const item = await MongoEmail.create(emailObj);
      return mapDoc(item.toObject());
    }
  }
};
