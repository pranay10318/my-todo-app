"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Todos", "userId", {
      type: Sequelize.DataTypes.INTEGER,
    });
    await queryInterface.addConstraint("Todos", {
      fields: ["userId"],
      type: "foreign key",
      references: {
        table: "Users",
        field: "id",
      },
    });
  },

  async down(queryInterface, Sequelize) {
    //when we roolback we should not hvae the userid column in todos table so remove
    await queryInterface.removeColumn("Todos", "userId");
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
